import { memo, useMemo, useState } from 'react';
import { Clock, ExternalLink, Maximize2, Minimize2, X, Zap } from 'lucide-react';
import { IPO_CONSTANTS, TICKER_TAPE_SYMBOLS } from '../data/ipoData';
import { getHlCoinForSymbol } from '../lib/hyperliquidFeed';
import { RealtimeCandleChart } from './RealtimeCandleChart';
import { TradingViewEmbed } from './TradingViewEmbed';

const ADVANCED_CHART_SCRIPT =
  'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';

type ChartFeedMode = 'realtime' | 'tradingview';

interface AdvancedChartPanelProps {
  activeSymbol: string;
  onSelectSymbol: (symbol: string) => void;
}

function AdvancedChartPanelComponent({
  activeSymbol,
  onSelectSymbol,
}: AdvancedChartPanelProps) {
  const [feedMode, setFeedMode] = useState<ChartFeedMode>('realtime');
  const [expanded, setExpanded] = useState(false);
  const [showIpoNotice, setShowIpoNotice] = useState(true);

  const hlCoin = getHlCoinForSymbol(activeSymbol);
  const effectiveMode: ChartFeedMode =
    feedMode === 'realtime' && hlCoin ? 'realtime' : 'tradingview';

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
          <span className="panel-badge panel-badge--emerald">
            {effectiveMode === 'realtime' && hlCoin ? hlCoin : activeSymbol}
          </span>

          {/* 0-Delay Real-Time vs TradingView Embed Switcher */}
          <div
            className="feed-mode-toggle"
            role="tablist"
            aria-label="Chart data feed mode"
          >
            <button
              id="chart-mode-realtime"
              type="button"
              role="tab"
              aria-selected={effectiveMode === 'realtime'}
              disabled={!hlCoin}
              className={`feed-mode-btn${effectiveMode === 'realtime' ? ' active-rt' : ''}`}
              onClick={() => setFeedMode('realtime')}
              title={
                hlCoin
                  ? `0-delay live WebSocket candlesticks (${hlCoin})`
                  : 'Real-time perp feed not available for QQQ'
              }
            >
              <Zap size={10} />
              <span>0-DELAY LIVE</span>
            </button>
            <button
              id="chart-mode-tradingview"
              type="button"
              role="tab"
              aria-selected={effectiveMode === 'tradingview'}
              className={`feed-mode-btn${effectiveMode === 'tradingview' ? ' active-tv' : ''}`}
              onClick={() => setFeedMode('tradingview')}
              title="Official TradingView widget with drawing tools (15m delayed Cboe One US stocks)"
            >
              <span>TRADINGVIEW (15M)</span>
            </button>
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

      {/* Show 15m Cboe delay notice only when user switches to TradingView embed mode on ANT */}
      {effectiveMode === 'tradingview' && isAntSelected && showIpoNotice && (
        <div className="ipo-cross-notice" role="note">
          <div className="ipo-cross-notice-text">
            <Clock size={12} color="#F59E0B" style={{ flexShrink: 0 }} />
            <span>
              <strong>TradingView Free Embed (15m Delay):</strong> US stock widgets use
              the 15-min delayed Cboe One feed. Switch back to{' '}
              <span className="mono">0-DELAY LIVE</span> for sub-second streaming{' '}
              <span className="mono">xyz:ANT</span> candles.
            </span>
          </div>
          <div className="ipo-cross-notice-actions">
            <button
              type="button"
              className="ipo-notice-peer-btn mono"
              onClick={() => setFeedMode('realtime')}
            >
              Switch to 0-Delay Live
            </button>
            <button
              type="button"
              className="ipo-notice-close"
              onClick={() => setShowIpoNotice(false)}
              aria-label="Dismiss TradingView delay notice"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}

      {effectiveMode === 'realtime' && hlCoin ? (
        <RealtimeCandleChart
          hlCoin={hlCoin}
          expanded={expanded}
          onFallbackToTradingView={() => setFeedMode('tradingview')}
        />
      ) : (
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
      )}

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
        <span>
          {effectiveMode === 'realtime'
            ? 'FEED: HYPERLIQUID HIP-3 0-DELAY WEBSOCKET • VWAP • EMA 9/21 • RSI • VOL'
            : 'FEED: TRADINGVIEW CBOE ONE (15M DELAY) • VWAP • EMA/SMA • RSI • VOL'}
        </span>
      </div>
    </section>
  );
}

export const AdvancedChartPanel = memo(AdvancedChartPanelComponent);
