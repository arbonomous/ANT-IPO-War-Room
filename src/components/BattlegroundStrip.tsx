interface BattlegroundStripProps {
  onSelectPriceLevel: (price: number) => void;
}

export function BattlegroundStrip({ onSelectPriceLevel }: BattlegroundStripProps) {
  return (
    <section
      className="battleground-strip"
      aria-label="IPO Reference and Key Battleground Levels"
    >
      {/* Card 1 — IPO Offer Price */}
      <article className="terminal-card metric-card metric-card--interactive">
        <div className="metric-card-top">
          <span className="metric-label">IPO Offer Price</span>
          <span className="metric-tag metric-tag--emerald">PRICED ABOVE</span>
        </div>
        <div className="metric-value metric-value--emerald">
          <button
            id="ref-ipo-price-btn"
            type="button"
            className="metric-value-btn"
            title="Load $83.00 IPO offer price into calculator"
            onClick={() => onSelectPriceLevel(83)}
          >
            $83.00
          </button>
        </div>
        <p className="metric-subtitle">
          Raised $81.3B • Priced above $70–$78 S-1 range
        </p>
      </article>

      {/* Card 2 — Institutional Valuation Anchor */}
      <article className="terminal-card metric-card">
        <div className="metric-card-top">
          <span className="metric-label">Institutional Valuation Anchor</span>
          <span className="metric-tag metric-tag--neutral">DILUTED</span>
        </div>
        <div className="metric-value">$1.50T</div>
        <p className="metric-subtitle">
          ~17.5B diluted shares • $85.7B per $1 move
        </p>
      </article>

      {/* Card 3 — Pre-Open Perp Reference */}
      <article className="terminal-card metric-card metric-card--interactive">
        <div className="metric-card-top">
          <span className="metric-label">Pre-Open Perp Reference</span>
          <span className="metric-tag metric-tag--amber">PRE-LAUNCH</span>
        </div>
        <div className="metric-value metric-value--amber">
          <button
            id="ref-perp-range-btn"
            type="button"
            className="metric-value-btn"
            title="Load $100.50 pre-open midpoint into calculator"
            onClick={() => onSelectPriceLevel(100.5)}
          >
            $97.00 – $104.00
          </button>
        </div>
        <p className="metric-subtitle">
          Hyperliquid pre-launch range • +17% to +25%
        </p>
      </article>

      {/* Card 4 — Key Dip / Support Zones */}
      <article className="terminal-card metric-card metric-card--interactive">
        <div className="metric-card-top">
          <span className="metric-label">Key Dip / Support Zones</span>
          <span className="metric-tag metric-tag--crimson">DEFENSE</span>
        </div>
        <div className="support-levels-row" aria-label="Support levels $83, $78, and $70">
          <button
            id="support-level-83"
            type="button"
            className="support-level-chip support-level-chip--emerald"
            title="Load $83.00 IPO defense level into calculator"
            onClick={() => onSelectPriceLevel(83)}
          >
            $83.00
          </button>
          <span className="support-sep">/</span>
          <button
            id="support-level-78"
            type="button"
            className="support-level-chip support-level-chip--amber"
            title="Load $78.00 S-1 top of range into calculator"
            onClick={() => onSelectPriceLevel(78)}
          >
            $78.00
          </button>
          <span className="support-sep">/</span>
          <button
            id="support-level-70"
            type="button"
            className="support-level-chip support-level-chip--crimson"
            title="Load $70.00 S-1 floor into calculator"
            onClick={() => onSelectPriceLevel(70)}
          >
            $70.00
          </button>
        </div>
        <p className="metric-subtitle">
          Underwriter defense &amp; S-1 floor targets
        </p>
      </article>
    </section>
  );
}
