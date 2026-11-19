import { memo, useMemo, useState } from 'react';
import { Clock, ExternalLink, Maximize2, Minimize2, X } from 'lucide-react';
import { IPO_CONSTANTS, TICKER_TAPE_SYMBOLS } from '../data/ipoData';
import { TradingViewEmbed } from './TradingViewEmbed';

const ADVANCED_CHART_SCRIPT =
  'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';

interface AdvancedChartPanelProps {
  activeSymbol: string;
  onSelectSymbol: (symbol: string) => void;
}

function AdvancedChartPanelComponent({
  activeSymbol,
  onSelectSymbol,
}: AdvancedChartPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [showIpoNotice, setShowIpoNotice] = useState(true);

  const configJson = useMemo(
    () =>
      JSON.stringify({
        autosize: true,
        symbol: activeSymbol,
        interval: '5',
        timezone: 'America/New_York',
        theme: 'dark',
        style: '1',
        locale: 'en',
        backgroundColor: '#09090B',
        gridColor: 'rgba(39, 39, 42, 0.45)',
        hide_top_toolbar: false,
        hide_side_toolbar: false,
        allow_symbol_change: true,
        hide_volume: false,
        calendar: false,
        withdateranges: true,
        studies: [
          'VWAP@tv-basicstudies',
          'MAExp@tv-basicstudies',
          'MASimple@tv-basicstudies',
          'RSI@tv-basicstudies',
        ],
        support_host: 'https://www.tradingview.com',
      }),
    [activeSymbol],
  );

  const externalChartUrl = `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(activeSymbol)}`;
  const isAntSelected = activeSymbol === IPO_CONSTANTS.ticker;

  return (
    <section
      className="terminal-card"
      aria-label="Real-Time Candlestick Chart"
    >
      <div className="panel-header">
        <div className="panel-title-group">
          <h2 className="panel-title">LIVE EXECUTION CHART</h2>
          <span className="panel-badge panel-badge--emerald">{activeSymbol}</span>
          <div className="study-chips" aria-label="Preloaded chart indicators">
            <span className="study-chip">5M</span>
            <span className="study-chip">VWAP</span>
            <span className="study-chip">EMA 9 / 21</span>
            <span className="study-chip">RSI</span>
          </div>
        </div>

        <div className="chart-toolbar-right">
          <div
            className="symbol-switcher"
            role="tablist"
            aria-label="Quick symbol focus switcher"
          >
            {TICKER_TAPE_SYMBOLS.map((item) => (
              <button
                key={item.proName}
                id={`chart-sym-${item.shortTicker.toLowerCase()}`}
                type="button"
                role="tab"
                aria-selected={activeSymbol === item.proName}
                className={`symbol-tab${activeSymbol === item.proName ? ' active' : ''}`}
                onClick={() => onSelectSymbol(item.proName)}
              >
                {item.shortTicker}
              </button>
            ))}
          </div>

          <button
            id="chart-height-toggle"
            type="button"
            className="icon-action-btn"
            onClick={() => setExpanded((prev) => !prev)}
            title={expanded ? 'Restore standard 620px height' : 'Expand chart height'}
          >
            {expanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
            <span>{expanded ? '620px' : 'Expand'}</span>
          </button>

          <a
            id="chart-open-tv-link"
            href={externalChartUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="icon-action-btn"
            title={`Open ${activeSymbol} on TradingView`}
          >
            <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* Helpful IPO Opening Cross & 15-min Cboe Feed Notice */}
      {isAntSelected && showIpoNotice && (
        <div className="ipo-cross-notice" role="note">
          <div className="ipo-cross-notice-text">
            <Clock size={12} color="#F59E0B" style={{ flexShrink: 0 }} />
            <span>
              <strong>IPO Opening Cross:</strong> NASDAQ IPOs begin trading after the
              underwriter opening auction (typically 11:30 AM – 1:30 PM ET). Free
              TradingView embeds use the 15-min delayed Cboe One feed, so{' '}
              <span className="mono">ANT</span> candles populate ~15m after the first
              print.
            </span>
          </div>
          <div className="ipo-cross-notice-actions">
            <button
              type="button"
              className="ipo-notice-peer-btn mono"
              onClick={() => onSelectSymbol('NASDAQ:NVDA')}
            >
              Preview Live NVDA
            </button>
            <button
              type="button"
              className="ipo-notice-close"
              onClick={() => setShowIpoNotice(false)}
              aria-label="Dismiss IPO opening cross notice"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}

      <div
        className={`chart-widget-frame${expanded ? ' chart-widget-frame--expanded' : ''}`}
      >
        <TradingViewEmbed
          scriptSrc={ADVANCED_CHART_SCRIPT}
          configJson={configJson}
          fillHeight
          ariaLabel={`TradingView Advanced Real-Time Chart for ${activeSymbol}`}
        />
      </div>

      <div className="chart-footnote-bar">
        <div className="chart-footnote-levels">
          <span>KEY ANT LEVELS:</span>
          <span className="level-dot-item">
            <span className="level-dot" style={{ backgroundColor: '#F59E0B' }} />
            <span>PERP $97–$104</span>
          </span>
          <span className="level-dot-item">
            <span className="level-dot" style={{ backgroundColor: '#10B981' }} />
            <span>IPO $83.00</span>
          </span>
          <span className="level-dot-item">
            <span className="level-dot" style={{ backgroundColor: '#EF4444' }} />
            <span>S-1 FLOOR $78 / $70</span>
          </span>
        </div>
        <span>STUDIES: VWAP • EMA / SMA • RSI • VOL</span>
      </div>
    </section>
  );
}

export const AdvancedChartPanel = memo(AdvancedChartPanelComponent);
