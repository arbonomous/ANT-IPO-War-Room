import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Edit3,
  MessageSquare,
  Radio,
  Send,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  WAR_ROOM_RELAYS,
  WarRoomClient,
  getOrCreateIdentity,
  loadCachedMessages,
  loadCachedVotes,
  saveCachedMessages,
  saveCachedVotes,
  saveLocalHandle,
  type FloorMessage,
  type SentimentVote,
  type TraderStance,
} from '../lib/warRoomNetwork';

interface WarRoomFloorPanelProps {
  onSelectPriceLevel: (price: number) => void;
}

type FilterTab = 'all' | 'bull' | 'bear';

interface QuickSignal {
  label: string;
  text: string;
  stance: TraderStance;
}

const QUICK_SIGNALS: QuickSignal[] = [
  { label: 'BIDDING $83', text: 'Bidding $83.00 IPO defense zone', stance: 'bull' },
  { label: 'BUYING OPEN', text: 'Buying the ANT opening cross', stance: 'bull' },
  { label: 'WAIT FOR $78 DIP', text: 'Waiting for $78.00 S-1 range retest', stance: 'bear' },
  { label: 'WATCH LOCK-UP', text: 'Watching Dec 15 +299M share unlock cliff', stance: 'watch' },
];

const QUICK_MACROS = ['$83.00', '$78.00', '$70.00', '$100.00'];

function formatMsgTime(unixSec: number): string {
  const d = new Date(unixSec * 1000);
  return d.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

/** Splits chat text so any $Price mention (e.g. $83, $104.50) becomes clickable to load into the Valuation Calculator */
function renderMessageWithPriceLinks(
  text: string,
  onSelectPriceLevel: (price: number) => void,
) {
  const parts = text.split(/(\$[0-9]{1,4}(?:\.[0-9]{1,2})?)/g);
  return parts.map((part, idx) => {
    if (/^\$[0-9]{1,4}(?:\.[0-9]{1,2})?$/.test(part)) {
      const numeric = Number.parseFloat(part.slice(1));
      if (Number.isFinite(numeric) && numeric > 0 && numeric < 10000) {
        return (
          <button
            key={`${part}-${idx}`}
            type="button"
            className="chat-price-chip"
            title={`Load ${part} into Implied Valuation Calc`}
            onClick={() => onSelectPriceLevel(numeric)}
          >
            {part}
          </button>
        );
      }
    }
    return <span key={idx}>{part}</span>;
  });
}

export function WarRoomFloorPanel({ onSelectPriceLevel }: WarRoomFloorPanelProps) {
  const [identity] = useState(() => getOrCreateIdentity());
  const clientRef = useRef<WarRoomClient | null>(null);
  const feedEndRef = useRef<HTMLDivElement | null>(null);
  const lastSendAtRef = useRef<number>(0);

  const [messages, setMessages] = useState<FloorMessage[]>(() => loadCachedMessages());
  const [votes, setVotes] = useState<Record<string, SentimentVote>>(() =>
    loadCachedVotes(),
  );
  const [relayStatus, setRelayStatus] = useState<{ connected: number; total: number }>({
    connected: 0,
    total: WAR_ROOM_RELAYS.length,
  });

  const [handle, setHandle] = useState<string>(identity.handle);
  const [editingHandle, setEditingHandle] = useState<boolean>(false);
  const [handleDraft, setHandleDraft] = useState<string>(identity.handle);

  const [stance, setStance] = useState<TraderStance>('bull');
  const [filter, setFilter] = useState<FilterTab>('all');
  const [draft, setDraft] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const [cooldownHint, setCooldownHint] = useState<string | null>(null);

  const handleIncomingMessage = useCallback((msg: FloorMessage) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      const next = [...prev, msg]
        .sort((a, b) => a.createdAt - b.createdAt)
        .slice(-100);
      saveCachedMessages(next);
      return next;
    });
  }, []);

  const handleIncomingVote = useCallback((vote: SentimentVote) => {
    setVotes((prev) => {
      const existing = prev[vote.pubkey];
      if (existing && existing.createdAt >= vote.createdAt) return prev;
      const next = { ...prev, [vote.pubkey]: vote };
      saveCachedVotes(next);
      return next;
    });
  }, []);

  useEffect(() => {
    const client = new WarRoomClient(identity, {
      onMessage: handleIncomingMessage,
      onVote: handleIncomingVote,
      onRelaysChange: (connected, total) => {
        setRelayStatus({ connected, total });
      },
    });
    clientRef.current = client;
    client.start();

    return () => {
      client.destroy();
      clientRef.current = null;
    };
  }, [identity, handleIncomingMessage, handleIncomingVote]);

  // Auto-scroll feed when new messages arrive
  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages.length, filter]);

  const filteredMessages = useMemo(() => {
    if (filter === 'all') return messages;
    return messages.filter((m) => m.stance === filter);
  }, [messages, filter]);

  const { bullVotes, bearVotes, totalVotes, bullPct, bearPct, myVote } = useMemo(() => {
    let bull = 0;
    let bear = 0;
    for (const v of Object.values(votes)) {
      if (v.vote === 'bull') bull += 1;
      else if (v.vote === 'bear') bear += 1;
    }
    const total = bull + bear;
    const bPct = total > 0 ? Math.round((bull / total) * 100) : 50;
    const rPct = total > 0 ? 100 - bPct : 50;
    const selfVote = votes[identity.pubkey]?.vote ?? null;
    return {
      bullVotes: bull,
      bearVotes: bear,
      totalVotes: total,
      bullPct: bPct,
      bearPct: rPct,
      myVote: selfVote,
    };
  }, [votes, identity.pubkey]);

  const activeTradersCount = useMemo(() => {
    const unique = new Set<string>([identity.pubkey]);
    for (const m of messages) unique.add(m.pubkey);
    for (const k of Object.keys(votes)) unique.add(k);
    return unique.size;
  }, [messages, votes, identity.pubkey]);

  const submitHandle = () => {
    const saved = saveLocalHandle(handleDraft);
    setHandle(saved);
    setHandleDraft(saved);
    setEditingHandle(false);
    clientRef.current?.updateHandle(saved);
  };

  const handleSend = async (
    textOverride?: string,
    stanceOverride?: TraderStance,
    kind: 'chat' | 'signal' = 'chat',
  ) => {
    const textToSend = (textOverride ?? draft).trim();
    if (!textToSend || sending) return;

    const now = Date.now();
    if (now - lastSendAtRef.current < 1500) {
      setCooldownHint('Slow down (1.5s rate limit)');
      window.setTimeout(() => setCooldownHint(null), 1500);
      return;
    }
    lastSendAtRef.current = now;

    setSending(true);
    if (!textOverride) setDraft('');
    try {
      await clientRef.current?.sendMessage(
        textToSend,
        stanceOverride ?? stance,
        kind,
      );
    } finally {
      setSending(false);
    }
  };

  const handleVote = async (side: 'bull' | 'bear') => {
    await clientRef.current?.castVote(side);
  };

  return (
    <section
      className="terminal-card floor-panel"
      aria-label="Live War Room Trader Chat and Crowd Sentiment"
    >
      {/* Header Bar */}
      <div className="panel-header">
        <div className="panel-title-group">
          <MessageSquare size={13} color="#10B981" aria-hidden="true" />
          <h2 className="panel-title">WAR ROOM FLOOR // LIVE CHAT</h2>
          <span
            className={`panel-badge ${
              relayStatus.connected > 0 ? 'panel-badge--emerald' : 'panel-badge--amber'
            }`}
            title="Serverless public Nostr WebSocket relays — zero signup required"
          >
            <Radio size={10} style={{ display: 'inline', marginRight: 4 }} />
            {relayStatus.connected > 0
              ? `${relayStatus.connected}/${relayStatus.total} RELAYS LIVE`
              : 'CONNECTING RELAYS…'}
          </span>
          <span className="panel-badge">{activeTradersCount} PARTICIPANTS</span>
        </div>

        <div className="floor-header-right">
          {/* Editable Trader Callsign */}
          {editingHandle ? (
            <form
              className="handle-edit-form"
              onSubmit={(e) => {
                e.preventDefault();
                submitHandle();
              }}
            >
              <input
                id="trader-handle-input"
                type="text"
                maxLength={18}
                className="handle-edit-input"
                value={handleDraft}
                onChange={(e) => setHandleDraft(e.target.value)}
                autoFocus
                aria-label="Edit trader callsign"
              />
              <button
                type="submit"
                className="icon-action-btn"
                title="Save callsign"
              >
                <Check size={12} color="#10B981" />
              </button>
            </form>
          ) : (
            <button
              id="edit-handle-btn"
              type="button"
              className="icon-action-btn"
              onClick={() => {
                setHandleDraft(handle);
                setEditingHandle(true);
              }}
              title="Click to customize your chat callsign"
            >
              <span>@{handle}</span>
              <Edit3 size={11} />
            </button>
          )}

          {/* Filter Tabs */}
          <div className="interval-tabs" role="tablist" aria-label="Filter floor messages">
            {(['all', 'bull', 'bear'] as FilterTab[]).map((tab) => (
              <button
                key={tab}
                id={`chat-filter-${tab}`}
                type="button"
                role="tab"
                aria-selected={filter === tab}
                className={`interval-tab${filter === tab ? ' active' : ''}`}
                onClick={() => setFilter(tab)}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Crowd Sentiment Bar + 1-Click Floor Signals */}
      <div className="sentiment-strip">
        <div className="sentiment-poll-block">
          <div className="sentiment-buttons">
            <button
              id="vote-bull-btn"
              type="button"
              className={`vote-btn vote-btn--bull${myVote === 'bull' ? ' voted' : ''}`}
              onClick={() => handleVote('bull')}
            >
              <TrendingUp size={12} />
              <span>BULLISH</span>
              <span className="mono">{bullPct}%</span>
            </button>

            <button
              id="vote-bear-btn"
              type="button"
              className={`vote-btn vote-btn--bear${myVote === 'bear' ? ' voted' : ''}`}
              onClick={() => handleVote('bear')}
            >
              <TrendingDown size={12} />
              <span>BEARISH</span>
              <span className="mono">{bearPct}%</span>
            </button>
          </div>

          <div className="sentiment-bar-wrap">
            <div className="sentiment-bar-track" aria-label="Live crowd sentiment split">
              <div
                className="sentiment-bar-bull"
                style={{ width: `${bullPct}%` }}
              />
              <div
                className="sentiment-bar-bear"
                style={{ width: `${bearPct}%` }}
              />
            </div>
            <span className="sentiment-count mono">
              {totalVotes > 0
                ? `${totalVotes} live vote${totalVotes === 1 ? '' : 's'} (${bullVotes}B / ${bearVotes}S)`
                : 'Cast first live sentiment vote'}
            </span>
          </div>
        </div>

        <div className="quick-signals-row" aria-label="One-click floor signals">
          <span className="quick-signals-label">1-CLICK SIGNAL:</span>
          {QUICK_SIGNALS.map((sig) => (
            <button
              key={sig.label}
              type="button"
              className={`signal-chip signal-chip--${sig.stance}`}
              onClick={() => handleSend(sig.text, sig.stance, 'signal')}
              disabled={sending}
            >
              {sig.label}
            </button>
          ))}
        </div>
      </div>

      {/* Live Message Feed */}
      <div
        id="war-room-chat-feed"
        className="chat-feed"
        role="log"
        aria-live="polite"
        aria-label="Live War Room chat messages"
      >
        {filteredMessages.length === 0 ? (
          <div className="chat-empty-state">
            <p className="chat-empty-title">
              Floor channel open — zero signup, global real-time relay active.
            </p>
            <p className="chat-empty-sub">
              Drop an opening cross call, target price (like <code>$83</code> or{' '}
              <code>$105</code> — prices become clickable), or tap a 1-click signal above.
            </p>
          </div>
        ) : (
          filteredMessages.map((msg) => (
            <div
              key={msg.id}
              className={`chat-msg-row${msg.kind === 'signal' ? ' chat-msg-row--signal' : ''}${msg.isSelf ? ' chat-msg-row--self' : ''}`}
            >
              <span className="chat-time mono">{formatMsgTime(msg.createdAt)}</span>
              <span className={`chat-stance-tag chat-stance-tag--${msg.stance}`}>
                {msg.stance === 'bull' ? 'BULL' : msg.stance === 'bear' ? 'BEAR' : 'NOTE'}
              </span>
              <span className="chat-handle mono">@{msg.handle}</span>
              <span className="chat-text">
                {renderMessageWithPriceLinks(msg.text, onSelectPriceLevel)}
              </span>
            </div>
          ))
        )}
        <div ref={feedEndRef} />
      </div>

      {/* Composer Footer */}
      <form
        className="chat-composer"
        onSubmit={(e) => {
          e.preventDefault();
          void handleSend();
        }}
      >
        <div className="stance-selector" role="group" aria-label="Select message stance">
          {(['bull', 'bear', 'watch'] as TraderStance[]).map((s) => (
            <button
              key={s}
              type="button"
              className={`stance-pick stance-pick--${s}${stance === s ? ' active' : ''}`}
              onClick={() => setStance(s)}
            >
              {s === 'bull' ? 'BULL' : s === 'bear' ? 'BEAR' : 'NOTE'}
            </button>
          ))}
        </div>

        <input
          id="war-room-chat-input"
          type="text"
          maxLength={280}
          className="chat-input"
          placeholder="Call a level, share your ANT bid/target (e.g. Bidding $83.00 defense)…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />

        <div className="composer-macros">
          {QUICK_MACROS.map((price) => (
            <button
              key={price}
              type="button"
              className="macro-btn mono"
              onClick={() =>
                setDraft((prev) => `${prev}${prev && !prev.endsWith(' ') ? ' ' : ''}${price} `)
              }
              title={`Insert ${price}`}
            >
              {price}
            </button>
          ))}
        </div>

        <button
          id="war-room-chat-send"
          type="submit"
          className="chat-send-btn"
          disabled={sending || !draft.trim()}
        >
          <Send size={13} />
          <span>SEND</span>
        </button>
      </form>

      {cooldownHint && <div className="chat-cooldown-bar mono">{cooldownHint}</div>}
    </section>
  );
}
