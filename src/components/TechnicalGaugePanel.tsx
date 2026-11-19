import { memo, useMemo, useState } from 'react';
import { TradingViewEmbed } from './TradingViewEmbed';

const TECHNICAL_ANALYSIS_SCRIPT =
  'https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js';

type TaInterval = '15m' | '1h';

interface TechnicalGaugePanelProps {
  symbol: string;
}

function TechnicalGaugePanelComponent({ symbol }: TechnicalGaugePanelProps) {
  const [interval, setInterval] = useState<TaInterval>('15m');

  const configJson = useMemo(
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
      }),
    [interval, symbol],
  );

  return (
    <section
      className="terminal-card"
      aria-label="TradingView Technical Analysis Consensus Gauge"
    >
      <div className="panel-header">
        <div className="panel-title-group">
          <h2 className="panel-title">TECHNICAL CONSENSUS</h2>
          <span className="panel-badge">{symbol.replace('NASDAQ:', '')}</span>
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

      <div className="ta-widget-wrap">
        <TradingViewEmbed
          scriptSrc={TECHNICAL_ANALYSIS_SCRIPT}
          configJson={configJson}
          fillHeight
          ariaLabel={`TradingView Technical Analysis Gauge for ${symbol} (${interval})`}
        />
      </div>
    </section>
  );
}

export const TechnicalGaugePanel = memo(TechnicalGaugePanelComponent);
