import { useEffect, useRef, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Calculator, Zap } from 'lucide-react';
import { IPO_CONSTANTS } from '../data/ipoData';
import {
  HyperliquidStream,
  fetchHyperliquidAssetCtx,
  type HlAssetCtx,
} from '../lib/hyperliquidFeed';

interface LiveRealtimeRibbonProps {
  onSyncLivePrice: (price: number) => void;
}

function formatCompactUsd(val: number): string {
  if (!Number.isFinite(val) || val <= 0) return '—';
  if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
  if (val >= 1e3) return `$${(val / 1e3).toFixed(0)}K`;
  return `$${val.toFixed(0)}`;
}

export function LiveRealtimeRibbon({ onSyncLivePrice }: LiveRealtimeRibbonProps) {
  const [ctx, setCtx] = useState<HlAssetCtx | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [flashDir, setFlashDir] = useState<'up' | 'down' | null>(null);
  const prevPxRef = useRef<number | null>(null);
  const flashTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const applyCtx = (next: HlAssetCtx) => {
      const prevPx = prevPxRef.current;
      if (prevPx !== null && Math.abs(next.markPx - prevPx) > 0.0001) {
        setFlashDir(next.markPx > prevPx ? 'up' : 'down');
        if (flashTimerRef.current !== null) {
          window.clearTimeout(flashTimerRef.current);
        }
        flashTimerRef.current = window.setTimeout(() => setFlashDir(null), 450);
      }
      prevPxRef.current = next.markPx;
      setCtx(next);
    };

    // Initial REST snapshot for immediate paint
    void fetchHyperliquidAssetCtx('xyz:ANT', controller.signal)
      .then((snap) => {
        if (snap) applyCtx(snap);
      })
      .catch(() => {});

    // Sub-second WebSocket stream
    const stream = new HyperliquidStream('xyz:ANT', {
      onAssetCtx: applyCtx,
      onStatus: setWsConnected,
    });
    stream.connect();

    // Backup REST refresh every 12s in case WS is proxied/blocked
    const pollId = window.setInterval(() => {
      void fetchHyperliquidAssetCtx('xyz:ANT')
        .then((snap) => {
          if (snap) applyCtx(snap);
        })
        .catch(() => {});
    }, 12_000);

    return () => {
      controller.abort();
      stream.destroy();
      window.clearInterval(pollId);
      if (flashTimerRef.current !== null) {
        window.clearTimeout(flashTimerRef.current);
      }
    };
  }, []);

  const livePrice = ctx?.markPx ?? null;
  const ipoDiff = livePrice !== null ? livePrice - IPO_CONSTANTS.ipoOfferPrice : null;
  const ipoPct =
    ipoDiff !== null ? (ipoDiff / IPO_CONSTANTS.ipoOfferPrice) * 100 : null;
  const impliedCapT =
    livePrice !== null
      ? (livePrice * IPO_CONSTANTS.dilutedSharesBillions) / 1000
      : null;

  const isAboveIpo = ipoDiff !== null && ipoDiff >= 0;

  return (
    <section
      className="terminal-card live-ribbon"
      aria-label="Zero-Delay Real-Time Anthropic Live Market Feed"
    >
      <div className="live-ribbon-left">
        <div className="live-ribbon-badge-group">
          <span className="live-zero-badge">
            <Zap size={11} />
            <span>0-DELAY LIVE</span>
          </span>
          <span className="live-venue-tag mono">
            HL xyz:ANT {wsConnected ? '• WS' : '• REST'}
          </span>
        </div>

        <div className="live-price-cluster">
          <span
            id="realtime-ant-price"
            className={`live-price-figure mono${
              flashDir === 'up'
                ? ' flash-up'
                : flashDir === 'down'
                  ? ' flash-down'
                  : ''
            }`}
          >
            {livePrice !== null ? `$${livePrice.toFixed(2)}` : 'Syncing…'}
          </span>

          {ipoPct !== null && ipoDiff !== null && (
            <span
              className={`live-ipo-spread mono ${
                isAboveIpo ? 'text-emerald' : 'text-crimson'
              }`}
            >
              {isAboveIpo ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
              <span>
                {isAboveIpo ? '+' : ''}
                {ipoPct.toFixed(2)}% vs $83 IPO ({isAboveIpo ? '+' : '-'}$
                {Math.abs(ipoDiff).toFixed(2)})
              </span>
            </span>
          )}
        </div>
      </div>

      <div className="live-ribbon-stats mono">
        <div className="ribbon-stat">
          <span className="ribbon-stat-label">LIVE MKT CAP</span>
          <span className="ribbon-stat-val">
            {impliedCapT !== null ? `$${impliedCapT.toFixed(2)}T` : '—'}
          </span>
        </div>

        <span className="ribbon-sep" aria-hidden="true" />

        <div className="ribbon-stat">
          <span className="ribbon-stat-label">24H VOL</span>
          <span className="ribbon-stat-val">
            {ctx ? formatCompactUsd(ctx.dayNtlVlm) : '—'}
          </span>
        </div>

        <span className="ribbon-sep" aria-hidden="true" />

        <div className="ribbon-stat">
          <span className="ribbon-stat-label">OPEN INT</span>
          <span className="ribbon-stat-val">
            {ctx ? formatCompactUsd(ctx.openInterest) : '—'}
          </span>
        </div>

        <span className="ribbon-sep" aria-hidden="true" />

        <div className="ribbon-stat">
          <span className="ribbon-stat-label">1H FUNDING</span>
          <span
            className={`ribbon-stat-val ${
              ctx && ctx.funding < 0 ? 'text-crimson' : 'text-emerald'
            }`}
          >
            {ctx ? `${ctx.funding >= 0 ? '+' : ''}${(ctx.funding * 100).toFixed(4)}%` : '—'}
          </span>
        </div>

        {livePrice !== null && (
          <button
            id="sync-live-to-calc-btn"
            type="button"
            className="ribbon-sync-btn"
            onClick={() => onSyncLivePrice(livePrice)}
            title="Load live 0-delay price into Implied Valuation & P&L Calculator"
          >
            <Calculator size={12} />
            <span>Use in Calc</span>
          </button>
        )}
      </div>
    </section>
  );
}
