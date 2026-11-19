import { useEffect, useState } from 'react';
import { Check, Share2 } from 'lucide-react';
import { IPO_CONSTANTS } from '../data/ipoData';

interface TerminalHeaderProps {
  onShareLink: () => void;
  copied: boolean;
}

function formatEtTime(date: Date): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date);
  } catch {
    return date.toTimeString().slice(0, 8);
  }
}

export function TerminalHeader({ onShareLink, copied }: TerminalHeaderProps) {
  const [etClock, setEtClock] = useState<string>(() => formatEtTime(new Date()));

  useEffect(() => {
    const id = window.setInterval(() => {
      setEtClock(formatEtTime(new Date()));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <header className="terminal-header">
      <div className="terminal-header-inner">
        <div className="brand-cluster">
          <div className="brand-mark" aria-hidden="true">
            A/
          </div>
          <h1 className="brand-title">
            <span>ANT</span>
            <span className="brand-slash">//</span>
            <span>IPO WAR ROOM</span>
          </h1>
          <div className="live-status-pill" role="status" aria-live="polite">
            <span className="pulse-dot" aria-hidden="true" />
            <span>LIVE MARKET MONITOR</span>
          </div>
        </div>

        <div className="header-controls">
          <div className="session-telemetry" aria-label="NASDAQ IPO session metadata">
            <span>{IPO_CONSTANTS.ticker}</span>
            <span className="session-divider" aria-hidden="true" />
            <span>IPO {IPO_CONSTANTS.ipoDateLabel}</span>
            <span className="session-divider" aria-hidden="true" />
            <span className="session-clock">{etClock} ET</span>
          </div>

          <button
            id="share-war-room-btn"
            type="button"
            className={`share-btn${copied ? ' copied' : ''}`}
            onClick={onShareLink}
          >
            {copied ? <Check size={14} strokeWidth={2.2} /> : <Share2 size={14} strokeWidth={2} />}
            <span>{copied ? 'Link Copied' : 'Share War Room Link'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
