import { memo, useEffect, useState } from 'react';
import { IPO_CONSTANTS } from '../data/ipoData';
import {
  fetchHyperliquidDexCtxMap,
  type HlAssetCtx,
} from '../lib/hyperliquidFeed';

interface TapeItemDef {
  hlCoin: string;
  ticker: string;
  name: string;
  isAnt?: boolean;
}

const TAPE_ITEMS: TapeItemDef[] = [
  { hlCoin: 'xyz:ANT', ticker: 'ANT', name: 'Anthropic', isAnt: true },
  { hlCoin: 'xyz:NVDA', ticker: 'NVDA', name: 'NVIDIA' },
  { hlCoin: 'xyz:MSFT', ticker: 'MSFT', name: 'Microsoft' },
  { hlCoin: 'xyz:GOOGL', ticker: 'GOOGL', name: 'Alphabet' },
  { hlCoin: 'xyz:AMZN', ticker: 'AMZN', name: 'Amazon' },
  { hlCoin: 'xyz:PLTR', ticker: 'PLTR', name: 'Palantir' },
  { hlCoin: 'xyz:XYZ100', ticker: 'NDX100', name: 'Nasdaq 100' },
  { hlCoin: 'xyz:META', ticker: 'META', name: 'Meta' },
  { hlCoin: 'xyz:TSLA', ticker: 'TSLA', name: 'Tesla' },
];

interface TradingViewTickerTapeProps {
  onSelectAntPrice?: (price: number) => void;
}

function TradingViewTickerTapeComponent({
  onSelectAntPrice,
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
        const baseRef = item.isAnt
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

        if (item.isAnt && price !== null && onSelectAntPrice) {
          return (
            <button
              key={`${copyIndex}-${item.hlCoin}`}
              type="button"
              tabIndex={copyIndex > 0 ? -1 : 0}
              className="tape-pill tape-pill--active"
              onClick={() => onSelectAntPrice(price)}
              title="Click to load live ANT price into Implied Valuation Calc"
            >
              <span className="tape-ticker mono">{item.ticker}</span>
              <span className="tape-name">{item.name}</span>
              <span className="tape-price mono">${price.toFixed(2)}</span>
              {pct !== null && (
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
        }

        return (
          <div
            key={`${copyIndex}-${item.hlCoin}`}
            className={`tape-pill tape-pill--static${item.isAnt ? ' tape-pill--active' : ''}`}
          >
            <span className="tape-ticker mono">{item.ticker}</span>
            <span className="tape-name">{item.name}</span>
            <span className="tape-price mono">
              {price !== null ? `$${price.toFixed(2)}` : '—'}
            </span>
            {pct !== null && (
              <span
                className={`tape-change mono ${
                  isUp ? 'text-emerald' : 'text-crimson'
                }`}
              >
                {isUp ? '+' : ''}
                {pct.toFixed(2)}%
              </span>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div
      className="ticker-tape-bar"
      role="region"
      aria-label="Live Scrolling AI & Market Context Ticker Tape — hover to pause"
    >
      <div className="ticker-marquee-track">
        {renderGroup(0)}
        {renderGroup(1)}
      </div>
    </div>
  );
}

export const TradingViewTickerTape = memo(TradingViewTickerTapeComponent);
