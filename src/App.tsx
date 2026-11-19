import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { AdvancedChartPanel } from './components/AdvancedChartPanel';
import { BattlegroundStrip } from './components/BattlegroundStrip';
import { LiveRealtimeRibbon } from './components/LiveRealtimeRibbon';
import { LockupCountdownPanel } from './components/LockupCountdownPanel';
import { TechnicalGaugePanel } from './components/TechnicalGaugePanel';
import { TerminalFooter } from './components/TerminalFooter';
import { TerminalHeader } from './components/TerminalHeader';
import { TradingViewTickerTape } from './components/TradingViewTickerTape';
import { ValuationCalculatorPanel } from './components/ValuationCalculatorPanel';
import { WarRoomFloorPanel } from './components/WarRoomFloorPanel';
import { IPO_CONSTANTS } from './data/ipoData';
import {
  THEME_MAP,
  applyTheme,
  getInitialTheme,
  type ThemeId,
} from './lib/themes';

async function copyTextToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to legacy textarea copy fallback
    }
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export function App() {
  const [themeId, setThemeId] = useState<ThemeId>(() => getInitialTheme());
  const [calcPriceInput, setCalcPriceInput] = useState<string>(
    IPO_CONSTANTS.ipoOfferPrice.toFixed(2),
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    applyTheme(themeId);
  }, [themeId]);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
      setCopied(false);
    }, 2600);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const handleSelectTheme = useCallback(
    (next: ThemeId) => {
      setThemeId(next);
      showToast(`Theme: ${THEME_MAP[next].label} (${THEME_MAP[next].description})`);
    },
    [showToast],
  );

  const handleShareLink = useCallback(async () => {
    const url = window.location.href;
    const ok = await copyTextToClipboard(url);
    if (ok) {
      setCopied(true);
      showToast('War Room link copied to clipboard');
    } else {
      showToast('Copy failed — copy URL from address bar');
    }
  }, [showToast]);

  const handleSelectPriceLevel = useCallback(
    (price: number) => {
      setCalcPriceInput(price.toFixed(2));
      showToast(`Loaded $${price.toFixed(2)} into Implied Valuation Calc`);
    },
    [showToast],
  );

  return (
    <div className="war-room-shell">
      {/* Module 1: Top Live Scrolling Market Context Tape + Compact Status Bar */}
      <TradingViewTickerTape onSelectAntPrice={handleSelectPriceLevel} />
      <TerminalHeader
        onShareLink={handleShareLink}
        copied={copied}
        themeId={themeId}
        onSelectTheme={handleSelectTheme}
      />

      <main className="terminal-main">
        {/* Real-Time 0-Delay Live Price Ribbon (Hyperliquid xyz:ANT) */}
        <LiveRealtimeRibbon onSyncLivePrice={handleSelectPriceLevel} />

        {/* Module 2: IPO Reference & Key Battleground Levels Strip */}
        <BattlegroundStrip onSelectPriceLevel={handleSelectPriceLevel} />

        {/* Module 3: 70% Live Chart + Floor Chat / 30% Intelligence & Tools Split */}
        <div className="workspace-grid">
          <div className="chart-column">
            <AdvancedChartPanel themeId={themeId} />
            <WarRoomFloorPanel onSelectPriceLevel={handleSelectPriceLevel} />
          </div>

          <aside
            className="intelligence-column"
            aria-label="IPO Intelligence and Tactical Tools"
          >
            {/* Panel A — Staggered Lock-Up Supply Cliff Countdown */}
            <LockupCountdownPanel />

            {/* Panel B — Interactive Implied Market Cap & Position Calculator */}
            <ValuationCalculatorPanel
              priceInput={calcPriceInput}
              onPriceInputChange={setCalcPriceInput}
            />

            {/* Panel C — Live Technical Analysis Consensus Gauge */}
            <TechnicalGaugePanel symbol={IPO_CONSTANTS.ticker} themeId={themeId} />
          </aside>
        </div>
      </main>

      {/* Module 4: Minimalist Institutional Footer */}
      <TerminalFooter />

      {/* Copy / Action Toast Notification */}
      {toastMessage && (
        <div className="toast-container" role="status" aria-live="polite">
          <div className="toast-pill">
            <CheckCircle2 size={14} color={THEME_MAP[themeId].bull} />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
