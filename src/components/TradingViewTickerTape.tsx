import { memo, useEffect, useState } from 'react';
import { IPO_CONSTANTS } from '../data/ipoData';
import {
  fetchHyperliquidDexCtxMap,
  type HlAssetCtx,
} from '../lib/hyperliquidFeed';

interface TapeItemDef {
  hlCoin: string;
  symbol: string;
  ticker: string;
  name: string;
  useIpoRef?: boolean;
}

const TAPE_ITEMS: TapeItemDef[] = [
  {
    hlCoin: 'xyz:ANT',
    symbol: 'NASDAQ:ANT',
    ticker: 'ANT',
    name: 'Anthropic',
    useIpoRef: true,
  },
  { hlCoin: 'xyz:NVDA', symbol: 'NASDAQ:NVDA', ticker: 'NVDA', name: 'NVIDIA' },
  { hlCoin: 'xyz:MSFT', symbol: 'NASDAQ:MSFT', ticker: 'MSFT', name: 'Microsoft' },
  { hlCoin: 'xyz:GOOGL', symbol: 'NASDAQ:GOOGL', ticker: 'GOOGL', name: 'Alphabet' },
  { hlCoin: 'xyz:AMZN', symbol: 'NASDAQ:AMZN', ticker: 'AMZN', name: 'Amazon' },
  { hlCoin: 'xyz:PLTR', symbol: 'NASDAQ:PLTR', ticker: 'PLTR', name: 'Palantir' },
  { hlCoin: 'xyz:XYZ100', symbol: 'NASDAQ:QQQ', ticker: 'NDX100', name: 'Nasdaq 100' },
  { hlCoin: 'xyz:META', symbol: 'NASDAQ:META', ticker: 'META', name: 'Meta' },
  { hlCoin: 'xyz:TSLA', symbol: 'NASDAQ:TSLA', ticker: 'TSLA', name: 'Tesla' },
];

interface TradingViewTickerTapeProps {
  activeSymbol: string;
  onSelectSymbol: (symbol: string) => void;
}

function TradingViewTickerTapeComponent({
  activeSymbol,
  onSelectSymbol,
}: TradingViewTickerTapeProps) {
  const [ctxMap, setCtxMap] = useState<Record<string, HlAssetCtx>>({});

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    const load = async () => {
      try {
        const next = await fetchHyperliquidDexCtxMap('xyz', controller.signal);
        if (active && Object.keys(next).length > 0) {
          setCtxMap(next);
        }
      } catch {
        // Keep last good snapshot on transient network error
      }
    };

    void load();
    const pollId = window.setInterval(() => {
      void load();
    }, 4000);

    return () => {
      active = false;
      controller.abort();
      window.clearInterval(pollId);
    };
  }, []);

  const renderGroup = (copyIndex: number) => (
    <div
      className="ticker-marquee-group"
      aria-hidden={copyIndex > 0 ? 'true' : undefined}
    >
      {TAPE_ITEMS.map((item) => {
        const ctx = ctxMap[item.hlCoin];
        const price = ctx?.markPx ?? null;
        const baseRef = item.useIpoRef
          ? IPO_CONSTANTS.ipoOfferPrice
          : (ctx?.prevDayPx ?? null);

        const diff =
          price !== null && baseRef !== null && baseRef > 0
            ? price - baseRef
            : null;
        const pct =
          diff !== null && baseRef !== null && baseRef > 0
            ? (diff / baseRef) * 100
            : null;
        const isUp = diff !== null && diff >= 0;
        const isSelected = activeSymbol === item.symbol;

        return (
          <button
            key={`${copyIndex}-${item.hlCoin}`}
            type="button"
            tabIndex={copyIndex > 0 ? -1 : 0}
            className={`tape-pill${isSelected ? ' tape-pill--active' : ''}`}
            onClick={() => onSelectSymbol(item.symbol)}
            title={`Click to view ${item.name} (${item.ticker}) on the chart — hover pauses tape`}
          >
            <span className="tape-ticker mono">{item.ticker}</span>
            <span className="tape-name">{item.name}</span>
            <span className="tape-price mono">
              {price !== null ? `$${price.toFixed(2)}` : '—'}
            </span>
            {pct !== null && diff !== null && (
              <span
                className={`tape-change mono ${
                  isUp ? 'text-emerald' : 'text-crimson'
                }`}
              >
                {isUp ? '+' : ''}
                {pct.toFixed(2)}%
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <div
      className="ticker-tape-bar"
      role="region"
      aria-label="Live Scrolling Stock Ticker Tape — hover to pause"
    >
      <div className="ticker-marquee-track">
        {renderGroup(0)}
        {renderGroup(1)}
      </div>
    </div>
  );
}

export const TradingViewTickerTape = memo(TradingViewTickerTapeComponent);
