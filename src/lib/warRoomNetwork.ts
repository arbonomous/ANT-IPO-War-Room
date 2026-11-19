import {
  SimplePool,
  finalizeEvent,
  generateSecretKey,
  getPublicKey,
  type Event,
} from 'nostr-tools';

export type TraderStance = 'bull' | 'bear' | 'watch';

export interface FloorMessage {
  id: string;
  pubkey: string;
  handle: string;
  stance: TraderStance;
  kind: 'chat' | 'signal';
  text: string;
  createdAt: number; // unix seconds
  isSelf?: boolean;
}

export interface SentimentVote {
  pubkey: string;
  vote: 'bull' | 'bear';
  createdAt: number;
}

export const WAR_ROOM_RELAYS: string[] = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.primal.net',
  'wss://relay.snort.social',
];

const CHAT_TAG = 'ant-ipo-war-room-chat-v1';
const VOTE_TAG = 'ant-ipo-war-room-vote-v1';
const SK_STORAGE_KEY = 'ant_war_room_sk_hex_v1';
const HANDLE_STORAGE_KEY = 'ant_war_room_handle_v1';
const CACHE_MSGS_KEY = 'ant_war_room_msgs_cache_v1';
const CACHE_VOTES_KEY = 'ant_war_room_votes_cache_v1';
const BC_NAME = 'ant-ipo-war-room-channel-v1';

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export function sanitizeHandle(raw: string): string {
  const cleaned = raw.trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 18);
  return cleaned || 'Trader';
}

export interface LocalIdentity {
  secretKey: Uint8Array;
  pubkey: string;
  handle: string;
}

export function getOrCreateIdentity(): LocalIdentity {
  let sk: Uint8Array | null = null;
  try {
    const savedHex = window.localStorage.getItem(SK_STORAGE_KEY);
    if (savedHex && /^[0-9a-f]{64}$/i.test(savedHex)) {
      sk = hexToBytes(savedHex);
    }
  } catch {
    // Ignore storage access errors
  }

  if (!sk) {
    sk = generateSecretKey();
    try {
      window.localStorage.setItem(SK_STORAGE_KEY, bytesToHex(sk));
    } catch {
      // Ignore
    }
  }

  const pubkey = getPublicKey(sk);
  let handle = `Desk_${pubkey.slice(0, 4).toUpperCase()}`;
  try {
    const savedHandle = window.localStorage.getItem(HANDLE_STORAGE_KEY);
    if (savedHandle) {
      handle = sanitizeHandle(savedHandle);
    }
  } catch {
    // Ignore
  }

  return { secretKey: sk, pubkey, handle };
}

export function saveLocalHandle(handle: string): string {
  const clean = sanitizeHandle(handle);
  try {
    window.localStorage.setItem(HANDLE_STORAGE_KEY, clean);
  } catch {
    // Ignore
  }
  return clean;
}

export function loadCachedMessages(): FloorMessage[] {
  try {
    const raw = window.localStorage.getItem(CACHE_MSGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FloorMessage[];
    return Array.isArray(parsed) ? parsed.slice(-80) : [];
  } catch {
    return [];
  }
}

export function saveCachedMessages(msgs: FloorMessage[]): void {
  try {
    window.localStorage.setItem(CACHE_MSGS_KEY, JSON.stringify(msgs.slice(-80)));
  } catch {
    // Ignore
  }
}

export function loadCachedVotes(): Record<string, SentimentVote> {
  try {
    const raw = window.localStorage.getItem(CACHE_VOTES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, SentimentVote>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveCachedVotes(votes: Record<string, SentimentVote>): void {
  try {
    window.localStorage.setItem(CACHE_VOTES_KEY, JSON.stringify(votes));
  } catch {
    // Ignore
  }
}

function getTagValue(event: Event, key: string): string | undefined {
  const found = event.tags.find((t) => t[0] === key && typeof t[1] === 'string');
  return found ? found[1] : undefined;
}

export function parseChatEvent(event: Event, selfPubkey: string): FloorMessage | null {
  const text = (event.content || '').trim().slice(0, 280);
  if (!text) return null;

  const rawHandle = getTagValue(event, 'handle') || `Desk_${event.pubkey.slice(0, 4).toUpperCase()}`;
  const rawStance = getTagValue(event, 'stance');
  const stance: TraderStance =
    rawStance === 'bull' || rawStance === 'bear' || rawStance === 'watch'
      ? rawStance
      : 'watch';
  const rawKind = getTagValue(event, 'msgtype');
  const kind: 'chat' | 'signal' = rawKind === 'signal' ? 'signal' : 'chat';

  return {
    id: event.id,
    pubkey: event.pubkey,
    handle: sanitizeHandle(rawHandle),
    stance,
    kind,
    text,
    createdAt: event.created_at,
    isSelf: event.pubkey === selfPubkey,
  };
}

export function parseVoteEvent(event: Event): SentimentVote | null {
  const rawVote = getTagValue(event, 'vote') || event.content.trim().toLowerCase();
  if (rawVote !== 'bull' && rawVote !== 'bear') return null;
  return {
    pubkey: event.pubkey,
    vote: rawVote,
    createdAt: event.created_at,
  };
}

export interface WarRoomClientCallbacks {
  onMessage: (msg: FloorMessage) => void;
  onVote: (vote: SentimentVote) => void;
  onRelaysChange: (connectedCount: number, totalCount: number) => void;
}

export class WarRoomClient {
  private pool: SimplePool;
  private identity: LocalIdentity;
  private connectedRelays = new Set<string>();
  private subClosers: Array<{ close: () => void }> = [];
  private bc: BroadcastChannel | null = null;
  private callbacks: WarRoomClientCallbacks;

  constructor(identity: LocalIdentity, callbacks: WarRoomClientCallbacks) {
    this.identity = identity;
    this.callbacks = callbacks;

    this.pool = new SimplePool({
      enableReconnect: true,
    });
    this.pool.onRelayConnectionSuccess = (url: string) => {
      this.connectedRelays.add(url);
      this.callbacks.onRelaysChange(this.connectedRelays.size, WAR_ROOM_RELAYS.length);
    };
    this.pool.onRelayConnectionFailure = (url: string) => {
      this.connectedRelays.delete(url);
      this.callbacks.onRelaysChange(this.connectedRelays.size, WAR_ROOM_RELAYS.length);
    };
  }

  start(): void {
    // 1. Instant cross-tab local sync
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.bc = new BroadcastChannel(BC_NAME);
        this.bc.onmessage = (ev: MessageEvent) => {
          const payload = ev.data;
          if (!payload || typeof payload !== 'object') return;
          if (payload.type === 'chat' && payload.message) {
            this.callbacks.onMessage(payload.message as FloorMessage);
          } else if (payload.type === 'vote' && payload.vote) {
            this.callbacks.onVote(payload.vote as SentimentVote);
          }
        };
      } catch {
        this.bc = null;
      }
    }

    // 2. Subscribe to global Nostr relays for chat history + live stream (last 7 days)
    const sinceTs = Math.floor(Date.now() / 1000) - 7 * 24 * 3600;

    const chatSub = this.pool.subscribeMany(
      WAR_ROOM_RELAYS,
      {
        kinds: [1],
        '#t': [CHAT_TAG],
        since: sinceTs,
        limit: 80,
      },
      {
        onevent: (evt) => {
          const parsed = parseChatEvent(evt, this.identity.pubkey);
          if (parsed) {
            this.callbacks.onMessage(parsed);
          }
        },
      },
    );

    const voteSub = this.pool.subscribeMany(
      WAR_ROOM_RELAYS,
      {
        kinds: [1],
        '#t': [VOTE_TAG],
        since: sinceTs,
        limit: 250,
      },
      {
        onevent: (evt) => {
          const parsed = parseVoteEvent(evt);
          if (parsed) {
            this.callbacks.onVote(parsed);
          }
        },
      },
    );

    this.subClosers.push(chatSub, voteSub);
  }

  updateHandle(handle: string): void {
    this.identity = { ...this.identity, handle: sanitizeHandle(handle) };
  }

  async sendMessage(
    text: string,
    stance: TraderStance,
    kind: 'chat' | 'signal' = 'chat',
  ): Promise<FloorMessage> {
    const cleanText = text.trim().slice(0, 280);
    const createdAt = Math.floor(Date.now() / 1000);

    const signed = finalizeEvent(
      {
        kind: 1,
        created_at: createdAt,
        tags: [
          ['t', CHAT_TAG],
          ['handle', this.identity.handle],
          ['stance', stance],
          ['msgtype', kind],
          ['client', 'ant-ipo-war-room'],
        ],
        content: cleanText,
      },
      this.identity.secretKey,
    );

    const message: FloorMessage = {
      id: signed.id,
      pubkey: signed.pubkey,
      handle: this.identity.handle,
      stance,
      kind,
      text: cleanText,
      createdAt,
      isSelf: true,
    };

    // Optimistic local + cross-tab emit immediately
    this.callbacks.onMessage(message);
    this.bc?.postMessage({ type: 'chat', message });

    // Broadcast to public Nostr relays (resolve as soon as relays settle)
    await Promise.allSettled(this.pool.publish(WAR_ROOM_RELAYS, signed));
    return message;
  }

  async castVote(vote: 'bull' | 'bear'): Promise<SentimentVote> {
    const createdAt = Math.floor(Date.now() / 1000);

    const signed = finalizeEvent(
      {
        kind: 1,
        created_at: createdAt,
        tags: [
          ['t', VOTE_TAG],
          ['vote', vote],
          ['client', 'ant-ipo-war-room'],
        ],
        content: vote,
      },
      this.identity.secretKey,
    );

    const record: SentimentVote = {
      pubkey: signed.pubkey,
      vote,
      createdAt,
    };

    this.callbacks.onVote(record);
    this.bc?.postMessage({ type: 'vote', vote: record });

    await Promise.allSettled(this.pool.publish(WAR_ROOM_RELAYS, signed));
    return record;
  }

  destroy(): void {
    for (const sub of this.subClosers) {
      try {
        sub.close();
      } catch {
        // Ignore close errors
      }
    }
    this.subClosers = [];
    this.bc?.close();
    this.bc = null;
    try {
      this.pool.close(WAR_ROOM_RELAYS);
    } catch {
      // Ignore
    }
  }
}
