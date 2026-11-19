import { memo, useMemo, useState } from 'react';
import { Clock, ExternalLink, Maximize2, Minimize2, X, Zap } from 'lucide-react';
import { IPO_CONSTANTS } from '../data/ipoData';
import { THEME_MAP, type ThemeId } from '../lib/themes';
import { RealtimeCandleChart } from './RealtimeCandleChart';
import { TradingViewEmbed } from './TradingViewEmbed';

const ADVANCED_CHART_SCRIPT =
  'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';

type ChartFeedMode = 'realtime' | 'tradingview';

interface AdvancedChartPanelProps {
  themeId: ThemeId;
}

function AdvancedChartPanelComponent({ themeId }: AdvancedChartPanelProps) {
  const [feedMode, setFeedMode] = useState<ChartFeedMode>('realtime');
  const [expanded, setExpanded] = useState(false);
  const [showIpoNotice, setShowIpoNotice] = useState(true);

  const palette = THEME_MAP[themeId];
  const antSymbol = IPO_CONSTANTS.ticker;

  const configJson = useMemo(
    () =>
      JSON.stringify({
        autosize: true,
        symbol: antSymbol,
        interval: '5',
        timezone: 'America/New_York',
        theme: palette.tvTheme,
        style: '1',
        locale: 'en',
        backgroundColor: palette.chartBg,
        gridColor: palette.chartGrid,
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
    [antSymbol, palette.tvTheme, palette.chartBg, palette.chartGrid],
  );

  return (
    <section
      className="terminal-card"
      aria-label="Anthropic ANT Real-Time Candlestick Chart"
    >
      <div className="panel-header">
        <div className="panel-title-group">
          <h2 className="panel-title">LIVE EXECUTION CHART</h2>
          <span className="panel-badge panel-badge--emerald">
            {feedMode === 'realtime' ? 'xyz:ANT' : antSymbol}
          </span>

          {/* 0-Delay Real-Time vs TradingView Embed Switcher */}
          <div
            className="feed-mode-toggle"
            role="tablist"
            aria-label="ANT chart data feed mode"
          >
            <button
              id="chart-mode-realtime"
              type="button"
              role="tab"
              aria-selected={feedMode === 'realtime'}
              className={`feed-mode-btn${feedMode === 'realtime' ? ' active-rt' : ''}`}
              onClick={() => setFeedMode('realtime')}
              title="0-delay live WebSocket candlesticks for Anthropic (xyz:ANT)"
            >
              <Zap size={10} />
              <span>0-DELAY LIVE</span>
            </button>
            <button
              id="chart-mode-tradingview"
              type="button"
              role="tab"
              aria-selected={feedMode === 'tradingview'}
              className={`feed-mode-btn${feedMode === 'tradingview' ? ' active-tv' : ''}`}
              onClick={() => setFeedMode('tradingview')}
              title="Official TradingView widget with drawing tools (15m delayed Cboe One)"
            >
              <span>TRADINGVIEW (15M)</span>
            </button>
          </div>
        </div>

        <div className="chart-toolbar-right">
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
            href={IPO_CONSTANTS.tradingViewFullChartUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="icon-action-btn"
            title="Open NASDAQ:ANT full-screen on TradingView"
          >
            <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* Show 15m Cboe delay notice only when user switches to TradingView embed mode */}
      {feedMode === 'tradingview' && showIpoNotice && (
        <div className="ipo-cross-notice" role="note">
          <div className="ipo-cross-notice-text">
            <Clock size={12} color={palette.amber} style={{ flexShrink: 0 }} />
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

      {feedMode === 'realtime' ? (
        <RealtimeCandleChart
          hlCoin="xyz:ANT"
          expanded={expanded}
          themeId={themeId}
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
            ariaLabel="TradingView Advanced Real-Time Chart for NASDAQ:ANT"
          />
        </div>
      )}

      <div className="chart-footnote-bar">
        <div className="chart-footnote-levels">
          <span>KEY ANT LEVELS:</span>
          <span className="level-dot-item">
            <span className="level-dot" style={{ backgroundColor: palette.amber }} />
            <span>PERP $97–$104</span>
          </span>
          <span className="level-dot-item">
            <span className="level-dot" style={{ backgroundColor: palette.bull }} />
            <span>IPO $83.00</span>
          </span>
          <span className="level-dot-item">
            <span className="level-dot" style={{ backgroundColor: palette.bear }} />
            <span>S-1 FLOOR $78 / $70</span>
          </span>
        </div>
        <span>
          {feedMode === 'realtime'
            ? 'FEED: HYPERLIQUID HIP-3 0-DELAY WEBSOCKET • VWAP • EMA 9/21 • RSI • VOL'
            : 'FEED: TRADINGVIEW CBOE ONE (15M DELAY) • VWAP • EMA/SMA • RSI • VOL'}
        </span>
      </div>
    </section>
  );
}

export const AdvancedChartPanel = memo(AdvancedChartPanelComponent);
