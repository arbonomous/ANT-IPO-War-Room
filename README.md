# ANT // IPO War Room

Real-time institutional financial terminal and IPO monitoring single-page web application dedicated to tracking **Anthropic (`NASDAQ:ANT`)** following its November 19, 2026 IPO.

## Core Modules

- **Live Ticker Tape & Status Bar**: Official TradingView Ticker Tape (`ANT`, `NVDA`, `MSFT`, `GOOGL`, `AMZN`, `PLTR`, `QQQ`), pulsing live status indicator, live ET session clock, and one-click URL share button with toast confirmation.
- **IPO Reference & Battleground Strip**: Quick-reference metrics for the `$83.00` IPO offer price (`$81.3B` raised), `$1.50T` institutional valuation anchor (`~17.5B` diluted shares), `$97.00–$104.00` pre-open perp reference, and clickable `$83.00 / $78.00 / $70.00` support levels.
- **TradingView Advanced Real-Time Chart (70% Split)**: 5-minute intraday candlestick chart preloaded with `VWAP`, `EMA / SMA`, `RSI`, and volume histogram, plus quick AI peer switching and expandable height.
- **Staggered Lock-Up Supply Cliff Countdown**: Live `DD:HH:MM:SS` countdown to the next S-1 unlock tranche (`Dec 15, 2026 — 299M shares`), segmented liquid float progress bar (`316M / 1,263M`), and full 4-wave visual schedule.
- **Interactive Implied Market Cap & Position Calculator**: Instant valuation calculation (`Price × 17.5B diluted shares`), `% vs. $83 IPO`, quick price presets (`$70`, `$78`, `$83`, `$92`, `$105`, `$120`), and custom allocation/entry P&L simulator.
- **TradingView Technical Analysis Gauge**: Real-time oscillator and moving average consensus widget with `15m` and `1h` interval toggles.

## Development

```bash
npm install
npm run dev
```

Zero external API keys required — all TradingView widgets load immediately out of the box.

## Production Build

```bash
npm run build
npm run preview
```
