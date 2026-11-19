import { useState } from 'react';
import { IPO_CONSTANTS, PRICE_PRESETS } from '../data/ipoData';

interface ValuationCalculatorPanelProps {
  priceInput: string;
  onPriceInputChange: (value: string) => void;
}

function formatValuation(billions: number): { headline: string; exact: string } {
  if (!Number.isFinite(billions) || billions <= 0) {
    return { headline: '$0.00B', exact: '$0.0B implied' };
  }
  if (billions >= 1000) {
    return {
      headline: `$${(billions / 1000).toFixed(2)}T`,
      exact: `$${billions.toLocaleString('en-US', { maximumFractionDigits: 1 })}B exact`,
    };
  }
  return {
    headline: `$${billions.toFixed(1)}B`,
    exact: `$${(billions / 1000).toFixed(3)}T implied`,
  };
}

function formatSignedCurrency(val: number): string {
  const abs = Math.abs(val);
  const formatted = abs.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (val > 0.004) return `+$${formatted}`;
  if (val < -0.004) return `-$${formatted}`;
  return '$0.00';
}

function formatSignedPct(pct: number): string {
  if (pct > 0.004) return `+${pct.toFixed(2)}%`;
  if (pct < -0.004) return `${pct.toFixed(2)}%`;
  return '0.00%';
}

export function ValuationCalculatorPanel({
  priceInput,
  onPriceInputChange,
}: ValuationCalculatorPanelProps) {
  const [allocationInput, setAllocationInput] = useState<string>('1000');
  const [entryInput, setEntryInput] = useState<string>(
    IPO_CONSTANTS.ipoOfferPrice.toFixed(2),
  );

  const parsedPrice = Math.max(0, Number.parseFloat(priceInput) || 0);
  const parsedAllocation = Math.max(0, Number.parseFloat(allocationInput) || 0);
  const parsedEntry = Math.max(0, Number.parseFloat(entryInput) || 0);

  // Implied Market Cap = Price * 17.5B diluted shares
  const impliedCapBillions = parsedPrice * IPO_CONSTANTS.dilutedSharesBillions;
  const valuationFormatted = formatValuation(impliedCapBillions);

  // Delta vs $83.00 IPO
  const ipoDeltaDollar = parsedPrice - IPO_CONSTANTS.ipoOfferPrice;
  const ipoDeltaPct = (ipoDeltaDollar / IPO_CONSTANTS.ipoOfferPrice) * 100;

  const ipoToneClass =
    ipoDeltaDollar > 0.005
      ? 'text-emerald'
      : ipoDeltaDollar < -0.005
        ? 'text-crimson'
        : 'text-amber';

  // Position Simulator (My Entry / Target)
  const shareCount = parsedEntry > 0 ? parsedAllocation / parsedEntry : 0;
  const targetValue = shareCount * parsedPrice;
  const pnlDollar = targetValue - parsedAllocation;
  const pnlPct = parsedAllocation > 0 ? (pnlDollar / parsedAllocation) * 100 : 0;

  const pnlToneClass =
    pnlDollar > 0.005
      ? 'text-emerald'
      : pnlDollar < -0.005
        ? 'text-crimson'
        : '';

  const isDefaultPrice = Math.abs(parsedPrice - IPO_CONSTANTS.ipoOfferPrice) < 0.005;

  return (
    <section
      className="terminal-card"
      aria-label="Interactive Implied Market Cap and Position Calculator"
    >
      <div className="panel-header">
        <div className="panel-title-group">
          <h2 className="panel-title">IMPLIED VALUATION CALC</h2>
        </div>
        <span className="panel-badge">17.5B DILUTED</span>
      </div>

      <div className="panel-body">
        {/* Hypothetical Share Price Input + Quick Presets */}
        <div className="calc-input-group">
          <div className="calc-label-row">
            <label htmlFor="ant-price-input" className="calc-label">
              Hypothetical ANT Share Price
            </label>
            {!isDefaultPrice && (
              <button
                id="reset-ipo-price-btn"
                type="button"
                className="calc-reset-link"
                onClick={() => onPriceInputChange('83.00')}
              >
                Reset $83 IPO
              </button>
            )}
          </div>

          <div className="currency-input-wrap">
            <span className="currency-prefix" aria-hidden="true">
              $
            </span>
            <input
              id="ant-price-input"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.50"
              className="currency-input"
              value={priceInput}
              onChange={(e) => onPriceInputChange(e.target.value)}
              aria-label="Hypothetical ANT share price in US dollars"
            />
          </div>

          <div className="preset-pills-row" role="group" aria-label="Quick price presets">
            {PRICE_PRESETS.map((preset) => {
              const isSelected = Math.abs(parsedPrice - preset) < 0.005;
              const activeClass = !isSelected
                ? ''
                : preset > IPO_CONSTANTS.ipoOfferPrice
                  ? ' active-bull'
                  : preset < IPO_CONSTANTS.ipoOfferPrice
                    ? ' active-bear'
                    : ' active-ipo';

              return (
                <button
                  key={preset}
                  id={`preset-price-${preset}`}
                  type="button"
                  className={`preset-pill${activeClass}`}
                  onClick={() => onPriceInputChange(preset.toFixed(2))}
                >
                  ${preset}
                </button>
              );
            })}
          </div>
        </div>

        {/* Implied Market Cap & % vs IPO Output */}
        <div className="calc-outputs-grid">
          <div className="calc-stat-box">
            <span className="calc-stat-label">Implied Valuation</span>
            <span id="implied-valuation-output" className="calc-stat-primary">
              {valuationFormatted.headline}
            </span>
            <span className="calc-stat-sub">{valuationFormatted.exact}</span>
          </div>

          <div className="calc-stat-box">
            <span className="calc-stat-label">vs. $83.00 IPO</span>
            <span
              id="ipo-change-pct-output"
              className={`calc-stat-primary ${ipoToneClass}`}
            >
              {formatSignedPct(ipoDeltaPct)}
            </span>
            <span className="calc-stat-sub">
              {formatSignedCurrency(ipoDeltaDollar)} / share
            </span>
          </div>
        </div>

        {/* My Entry / Target Position Calculator */}
        <div className="position-divider">
          <div className="position-header">
            <span className="position-title">My Entry / Target P&amp;L</span>
            <span className="position-target-note">
              Target: ${parsedPrice.toFixed(2)}
            </span>
          </div>

          <div className="position-inputs-row">
            <div className="position-field">
              <label htmlFor="position-allocation-input" className="position-field-label">
                Allocation ($)
              </label>
              <div className="currency-input-wrap currency-input-wrap--compact">
                <span className="currency-prefix" aria-hidden="true">
                  $
                </span>
                <input
                  id="position-allocation-input"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="100"
                  className="currency-input currency-input--compact"
                  value={allocationInput}
                  onChange={(e) => setAllocationInput(e.target.value)}
                />
              </div>
            </div>

            <div className="position-field">
              <label htmlFor="position-entry-input" className="position-field-label">
                Entry Price ($)
              </label>
              <div className="currency-input-wrap currency-input-wrap--compact">
                <span className="currency-prefix" aria-hidden="true">
                  $
                </span>
                <input
                  id="position-entry-input"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.50"
                  className="currency-input currency-input--compact"
                  value={entryInput}
                  onChange={(e) => setEntryInput(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="position-results-strip" aria-live="polite">
            <div className="pos-metric">
              <span className="pos-metric-label">Shares</span>
              <span id="position-shares-output" className="pos-metric-val">
                {shareCount.toFixed(2)}
              </span>
            </div>

            <div className="pos-metric">
              <span className="pos-metric-label">Value</span>
              <span id="position-value-output" className="pos-metric-val">
                $
                {targetValue.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>

            <div className="pos-metric">
              <span className="pos-metric-label">Est. P&amp;L</span>
              <span
                id="position-pnl-output"
                className={`pos-metric-val ${pnlToneClass}`}
                title={`${formatSignedCurrency(pnlDollar)} (${formatSignedPct(pnlPct)})`}
              >
                {formatSignedCurrency(pnlDollar)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
