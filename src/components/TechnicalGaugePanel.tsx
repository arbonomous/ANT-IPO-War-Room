import { memo, useEffect, useMemo, useState } from 'react';
import {
  fetchHyperliquidCandles,
  getHlCoinForSymbol,
} from '../lib/hyperliquidFeed';
import {
  evaluateTechnicals,
  type TechnicalSummary,
} from '../lib/technicalEngine';
import { TradingViewEmbed } from './TradingViewEmbed';

const TECHNICAL_ANALYSIS_SCRIPT =
  'https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js';

type TaInterval = '15m' | '1h';

interface TechnicalGaugePanelProps {
  symbol: string;
}

function getVerdictColor(verdict: TechnicalSummary['verdict']): string {
  if (verdict === 'STRONG BUY' || verdict === 'BUY') return '#10B981';
  if (verdict === 'STRONG SELL' || verdict === 'SELL') return '#EF4444';
  return '#A1A1AA';
}

function TechnicalGaugePanelComponent({ symbol }: TechnicalGaugePanelProps) {
  const [interval, setInterval] = useState<TaInterval>('15m');
  const [summary, setSummary] = useState<TechnicalSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const hlCoin = getHlCoinForSymbol(symbol);

  useEffect(() => {
    if (!hlCoin) {
      setSummary(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const load = async (initial: boolean) => {
      if (initial) setLoading(true);
      try {
        const candles = await fetchHyperliquidCandles(
          hlCoin,
          interval,
          160,
          controller.signal,
        );
        if (!cancelled) {
          setSummary(evaluateTechnicals(candles));
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load(true);
    const pollId = window.setInterval(() => {
      void load(false);
    }, 30_000);

    return () => {
      cancelled = true;
      controller.abort();
      window.clearInterval(pollId);
    };
  }, [hlCoin, interval]);

  // Fallback TradingView widget for symbols without a Hyperliquid HIP-3 perp (e.g. QQQ)
  const tvConfigJson = useMemo(
    () =>
      JSON.stringify({
        interval,
        width: '100%',
        isTransparent: true,
        height: 390,
        symbol,
        showIntervalTabs: true,
        displayMode: 'single',
        locale: 'en',
        colorTheme: 'dark',
        theme: 'dark',
      }),
    [interval, symbol],
  );

  // Needle angle mapped cleanly from -72 deg (Strong Sell) to +72 deg (Strong Buy)
  const needleDeg = summary
    ? Math.max(-72, Math.min(72, summary.score * 78))
    : 0;
  const verdictColor = summary ? getVerdictColor(summary.verdict) : '#A1A1AA';

  return (
    <section
      className="terminal-card"
      aria-label="Live Technical Analysis Consensus Gauge"
    >
      <div className="panel-header">
        <div className="panel-title-group">
          <h2 className="panel-title">TECHNICAL CONSENSUS</h2>
          <span className="panel-badge panel-badge--emerald">
            {hlCoin ? hlCoin : symbol.replace('NASDAQ:', '')}
          </span>
        </div>

        <div className="interval-tabs" role="tablist" aria-label="Technical gauge timeframe">
          <button
            id="ta-interval-15m"
            type="button"
            role="tab"
            aria-selected={interval === '15m'}
            className={`interval-tab${interval === '15m' ? ' active' : ''}`}
            onClick={() => setInterval('15m')}
          >
            15m
          </button>
          <button
            id="ta-interval-1h"
            type="button"
            role="tab"
            aria-selected={interval === '1h'}
            className={`interval-tab${interval === '1h' ? ' active' : ''}`}
            onClick={() => setInterval('1h')}
          >
            1h
          </button>
        </div>
      </div>

      {!hlCoin ? (
        <div className="ta-widget-wrap">
          <TradingViewEmbed
            scriptSrc={TECHNICAL_ANALYSIS_SCRIPT}
            configJson={tvConfigJson}
            fillHeight
            ariaLabel={`TradingView Technical Analysis Gauge for ${symbol} (${interval})`}
          />
        </div>
      ) : (
        <div className="ta-live-body">
          {loading && !summary ? (
            <div className="ta-loading-state mono">
              Computing {interval} oscillators &amp; MAs for {hlCoin}…
            </div>
          ) : !summary ? (
            <div className="ta-loading-state mono">
              Waiting for enough {interval} candles to compute consensus.
            </div>
          ) : (
            <>
              {/* Speedometer Gauge */}
              <div className="ta-gauge-box">
                <svg
                  viewBox="0 0 260 144"
                  className="ta-gauge-svg"
                  role="img"
                  aria-label={`Technical consensus: ${summary.verdict}`}
                >
                  {/* 5-zone arc */}
                  <path
                    d="M 24 126 A 106 106 0 0 1 65 42"
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth="10"
                    opacity="0.82"
                  />
                  <path
                    d="M 69 39 A 106 106 0 0 1 112 22"
                    fill="none"
                    stroke="#F87171"
                    strokeWidth="10"
                    opacity="0.52"
                  />
                  <path
                    d="M 116 21 A 106 106 0 0 1 144 21"
                    fill="none"
                    stroke="#71717A"
                    strokeWidth="10"
                    opacity="0.55"
                  />
                  <path
                    d="M 148 22 A 106 106 0 0 1 191 39"
                    fill="none"
                    stroke="#34D399"
                    strokeWidth="10"
                    opacity="0.62"
                  />
                  <path
                    d="M 195 42 A 106 106 0 0 1 236 126"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="10"
                    opacity="0.92"
                  />

                  {/* Labels */}
                  <text
                    x="14"
                    y="140"
                    fill="#EF4444"
                    fontSize="8.5"
                    fontFamily="JetBrains Mono, monospace"
                    fontWeight="700"
                  >
                    STRONG SELL
                  </text>
                  <text
                    x="130"
                    y="12"
                    fill="#71717A"
                    fontSize="8.5"
                    fontFamily="JetBrains Mono, monospace"
                    textAnchor="middle"
                  >
                    NEUTRAL
                  </text>
                  <text
                    x="246"
                    y="140"
                    fill="#10B981"
                    fontSize="8.5"
                    fontFamily="JetBrains Mono, monospace"
                    fontWeight="700"
                    textAnchor="end"
                  >
                    STRONG BUY
                  </text>

                  {/* Animated Needle */}
                  <g
                    transform={`rotate(${needleDeg.toFixed(1)} 130 126)`}
                    style={{ transition: 'transform 380ms cubic-bezier(0.22, 1, 0.36, 1)' }}
                  >
                    <line
                      x1="130"
                      y1="126"
                      x2="130"
                      y2="34"
                      stroke="#FAFAFA"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <circle
                      cx="130"
                      cy="126"
                      r="5.5"
                      fill={verdictColor}
                      stroke="#09090B"
                      strokeWidth="2"
                    />
                  </g>
                </svg>

                <div
                  id="ta-consensus-verdict"
                  className="ta-verdict mono"
                  style={{ color: verdictColor }}
                >
                  {summary.verdict}
                </div>

                <div className="ta-summary-counts mono">
                  <div className="ta-count-cell">
                    <span className="ta-count-label">SELL</span>
                    <span className="ta-count-num text-crimson">{summary.sellCount}</span>
                  </div>
                  <div className="ta-count-cell">
                    <span className="ta-count-label">NEUTRAL</span>
                    <span className="ta-count-num">{summary.neutralCount}</span>
                  </div>
                  <div className="ta-count-cell">
                    <span className="ta-count-label">BUY</span>
                    <span className="ta-count-num text-emerald">{summary.buyCount}</span>
                  </div>
                </div>
              </div>

              {/* Oscillators vs Moving Averages Split */}
              <div className="ta-groups-row mono">
                <div className="ta-group-card">
                  <span className="ta-group-title">OSCILLATORS</span>
                  <span className="ta-group-tally">
                    <span className="text-crimson">{summary.oscCounts.sell}S</span>
                    {' / '}
                    <span>{summary.oscCounts.neutral}N</span>
                    {' / '}
                    <span className="text-emerald">{summary.oscCounts.buy}B</span>
                  </span>
                </div>
                <div className="ta-group-card">
                  <span className="ta-group-title">MOVING AVGS</span>
                  <span className="ta-group-tally">
                    <span className="text-crimson">{summary.maCounts.sell}S</span>
                    {' / '}
                    <span>{summary.maCounts.neutral}N</span>
                    {' / '}
                    <span className="text-emerald">{summary.maCounts.buy}B</span>
                  </span>
                </div>
              </div>

              {/* Live Indicator Readout Pills */}
              <div className="ta-highlights-grid mono">
                {summary.highlights.map((ind) => (
                  <div key={ind.name} className="ta-ind-pill">
                    <span className="ta-ind-name">{ind.name}</span>
                    <span
                      className={`ta-ind-val ${
                        ind.signal === 'buy'
                          ? 'text-emerald'
                          : ind.signal === 'sell'
                            ? 'text-crimson'
                            : ''
                      }`}
                    >
                      {ind.valueLabel}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}

export const TechnicalGaugePanel = memo(TechnicalGaugePanelComponent);
