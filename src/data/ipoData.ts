export interface TickerSymbolConfig {
  proName: string;
  title: string;
  shortTicker: string;
}

export interface UnlockWave {
  id: string;
  dateLabel: string;
  dayLabel: string;
  sharesMillions: number;
  /** Market open (09:30 AM ET) ISO timestamp for deterministic live countdown */
  unlockIso: string;
  description: string;
}

export const IPO_CONSTANTS = {
  ticker: 'NASDAQ:ANT',
  shortTicker: 'ANT',
  companyName: 'Anthropic',
  ipoDateLabel: 'NOV 19, 2026',
  ipoOfferPrice: 83.0,
  s1RangeLow: 70.0,
  s1RangeHigh: 78.0,
  perpLow: 97.0,
  perpHigh: 104.0,
  dilutedSharesBillions: 17.5,
  totalClassAPoolMillions: 1263,
  tradingViewFullChartUrl: 'https://www.tradingview.com/chart/?symbol=NASDAQ%3AANT',
} as const;

export const TICKER_TAPE_SYMBOLS: TickerSymbolConfig[] = [
  { proName: 'NASDAQ:ANT', title: 'Anthropic', shortTicker: 'ANT' },
  { proName: 'NASDAQ:NVDA', title: 'NVIDIA', shortTicker: 'NVDA' },
  { proName: 'NASDAQ:MSFT', title: 'Microsoft', shortTicker: 'MSFT' },
  { proName: 'NASDAQ:GOOGL', title: 'Alphabet', shortTicker: 'GOOGL' },
  { proName: 'NASDAQ:AMZN', title: 'Amazon', shortTicker: 'AMZN' },
  { proName: 'NASDAQ:PLTR', title: 'Palantir', shortTicker: 'PLTR' },
  { proName: 'NASDAQ:QQQ', title: 'Invesco QQQ', shortTicker: 'QQQ' },
];

export const UNLOCK_WAVES: UnlockWave[] = [
  {
    id: 'wave-1',
    dateLabel: 'Nov 19, 2026',
    dayLabel: 'Day 1',
    sharesMillions: 316,
    unlockIso: '2026-11-19T09:30:00-05:00',
    description: 'Initial IPO offering float',
  },
  {
    id: 'wave-2',
    dateLabel: 'Dec 15, 2026',
    dayLabel: 'Day 27',
    sharesMillions: 299,
    unlockIso: '2026-12-15T09:30:00-05:00',
    description: 'First staggered lock-up release',
  },
  {
    id: 'wave-3',
    dateLabel: 'Jan 05, 2027',
    dayLabel: 'Day 48',
    sharesMillions: 299,
    unlockIso: '2027-01-05T09:30:00-05:00',
    description: 'Second staggered lock-up release',
  },
  {
    id: 'wave-4',
    dateLabel: 'Jan 19, 2027',
    dayLabel: 'Day 62',
    sharesMillions: 349,
    unlockIso: '2027-01-19T09:30:00-05:00',
    description: 'Final Class A tranche release',
  },
];

export const PRICE_PRESETS: number[] = [70, 78, 83, 92, 105, 120];
