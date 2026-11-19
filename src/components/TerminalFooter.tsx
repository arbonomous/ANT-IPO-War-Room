import { ExternalLink } from 'lucide-react';
import { IPO_CONSTANTS } from '../data/ipoData';

export function TerminalFooter() {
  return (
    <footer className="terminal-footer">
      <div className="terminal-footer-inner">
        <p className="footer-disclaimer">
          Live market quotes, intraday charts, and technical oscillator consensus are
          powered by official TradingView widgets for real-time IPO informational
          monitoring only. Reference S-1 lock-up tranches and valuation calculations do
          not constitute investment advice.
        </p>

        <a
          id="footer-tradingview-link"
          href={IPO_CONSTANTS.tradingViewFullChartUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="footer-tv-link"
        >
          <span>Open NASDAQ:ANT Full-Screen on TradingView</span>
          <ExternalLink size={12} />
        </a>
      </div>
    </footer>
  );
}
