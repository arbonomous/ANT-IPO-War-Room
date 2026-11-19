import { memo, useMemo } from 'react';
import { TICKER_TAPE_SYMBOLS } from '../data/ipoData';
import { THEME_MAP, type ThemeId } from '../lib/themes';
import { TradingViewEmbed } from './TradingViewEmbed';

const TICKER_TAPE_SCRIPT =
  'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';

interface TradingViewTickerTapeProps {
  themeId: ThemeId;
}

function TradingViewTickerTapeComponent({ themeId }: TradingViewTickerTapeProps) {
  const tvTheme = THEME_MAP[themeId].tvTheme;

  const configJson = useMemo(
    () =>
      JSON.stringify({
        symbols: TICKER_TAPE_SYMBOLS.map(({ proName, title }) => ({
          proName,
          title,
        })),
        showSymbolLogo: true,
        isTransparent: true,
        displayMode: 'adaptive',
        colorTheme: tvTheme,
        theme: tvTheme,
        locale: 'en',
      }),
    [tvTheme],
  );

  return (
    <div className="ticker-tape-bar" role="region" aria-label="Live AI & Tech Market Ticker Tape">
      <TradingViewEmbed
        scriptSrc={TICKER_TAPE_SCRIPT}
        configJson={configJson}
        ariaLabel="TradingView Ticker Tape for ANT, NVDA, MSFT, GOOGL, AMZN, PLTR, and QQQ"
      />
    </div>
  );
}

export const TradingViewTickerTape = memo(TradingViewTickerTapeComponent);
