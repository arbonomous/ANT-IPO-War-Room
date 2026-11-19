import { useEffect, useMemo, useState } from 'react';
import { IPO_CONSTANTS, UNLOCK_WAVES, type UnlockWave } from '../data/ipoData';

interface CountdownParts {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
  completed: boolean;
}

function pad2(n: number): string {
  return String(Math.max(0, Math.floor(n))).padStart(2, '0');
}

function computeCountdown(targetMs: number, nowMs: number): CountdownParts {
  const diff = Math.max(0, targetMs - nowMs);
  if (diff <= 0) {
    return { days: '00', hours: '00', minutes: '00', seconds: '00', completed: true };
  }
  const totalSec = Math.floor(diff / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  return {
    days: pad2(days),
    hours: pad2(hours),
    minutes: pad2(minutes),
    seconds: pad2(seconds),
    completed: false,
  };
}

type WaveStatus = 'active' | 'next' | 'locked';

export function LockupCountdownPanel() {
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(timerId);
  }, []);

  const { waveStatuses, nextWave, unlockedMillions } = useMemo(() => {
    // Wave 1 (Nov 19, 2026 Day 1) is always active IPO float; subsequent waves unlock by timestamp
    const statuses: Record<string, WaveStatus> = {};
    let upcoming: UnlockWave | null = null;
    let liquid = 0;

    for (const wave of UNLOCK_WAVES) {
      const waveMs = Date.parse(wave.unlockIso);
      const isUnlocked = wave.id === 'wave-1' || nowMs >= waveMs;

      if (isUnlocked) {
        statuses[wave.id] = 'active';
        liquid += wave.sharesMillions;
      } else if (!upcoming) {
        statuses[wave.id] = 'next';
        upcoming = wave;
      } else {
        statuses[wave.id] = 'locked';
      }
    }

    return {
      waveStatuses: statuses,
      nextWave: upcoming,
      unlockedMillions: liquid,
    };
  }, [nowMs]);

  const countdown = useMemo(() => {
    if (!nextWave) {
      return { days: '00', hours: '00', minutes: '00', seconds: '00', completed: true };
    }
    return computeCountdown(Date.parse(nextWave.unlockIso), nowMs);
  }, [nextWave, nowMs]);

  const totalPool = IPO_CONSTANTS.totalClassAPoolMillions;
  const liquidPct = ((unlockedMillions / totalPool) * 100).toFixed(1);

  return (
    <section
      className="terminal-card"
      aria-label="Staggered Lock-Up Supply Cliff Countdown"
    >
      <div className="panel-header">
        <div className="panel-title-group">
          <h2 className="panel-title">LOCK-UP SUPPLY CLIFF</h2>
        </div>
        <span className="panel-badge panel-badge--crimson">S-1 UNLOCKS</span>
      </div>

      <div className="panel-body">
        {/* Live Countdown Block */}
        <div className="countdown-hero">
          <div className="countdown-target-row">
            <span className="countdown-target-label">
              {nextWave
                ? `NEXT: ${nextWave.dateLabel.toUpperCase()} (${nextWave.dayLabel.toUpperCase()})`
                : 'ALL S-1 TRANCHES UNLOCKED'}
            </span>
            {nextWave && (
              <span className="countdown-target-shares">
                +{nextWave.sharesMillions}M SH
              </span>
            )}
          </div>

          <div
            id="lockup-countdown-timer"
            className="countdown-grid"
            role="timer"
            aria-label="Time remaining until next Class A lock-up unlock"
          >
            <div className="countdown-cell">
              <span className="countdown-num">{countdown.days}</span>
              <span className="countdown-unit">Days</span>
            </div>
            <div className="countdown-cell">
              <span className="countdown-num">{countdown.hours}</span>
              <span className="countdown-unit">Hrs</span>
            </div>
            <div className="countdown-cell">
              <span className="countdown-num">{countdown.minutes}</span>
              <span className="countdown-unit">Mins</span>
            </div>
            <div className="countdown-cell">
              <span className="countdown-num">{countdown.seconds}</span>
              <span className="countdown-unit">Secs</span>
            </div>
          </div>
        </div>

        {/* Cumulative Unlocked Supply Progress Bar */}
        <div className="supply-progress-block">
          <div className="supply-progress-header">
            <span className="supply-progress-label">Class A Liquid Pool</span>
            <span className="supply-progress-stat">
              <span>{unlockedMillions.toLocaleString()}M</span> /{' '}
              {totalPool.toLocaleString()}M ({liquidPct}%)
            </span>
          </div>

          <div
            className="supply-bar-track"
            role="progressbar"
            aria-valuenow={unlockedMillions}
            aria-valuemin={0}
            aria-valuemax={totalPool}
            aria-label={`${unlockedMillions}M of ${totalPool}M Class A shares currently liquid`}
          >
            {UNLOCK_WAVES.map((wave) => {
              const status = waveStatuses[wave.id];
              const widthPct = (wave.sharesMillions / totalPool) * 100;
              const segClass =
                status === 'active'
                  ? 'supply-segment--unlocked'
                  : status === 'next'
                    ? 'supply-segment--next'
                    : 'supply-segment--locked';

              return (
                <div
                  key={wave.id}
                  className={`supply-segment ${segClass}`}
                  style={{ width: `${widthPct}%` }}
                  title={`${wave.dateLabel} (${wave.dayLabel}): ${wave.sharesMillions}M Class A shares`}
                />
              );
            })}
          </div>
        </div>

        {/* 4-Wave Visual Timeline */}
        <div className="unlock-timeline" aria-label="Anthropic S-1 four-wave unlock schedule">
          {UNLOCK_WAVES.map((wave) => {
            const status = waveStatuses[wave.id];
            const dotClass =
              status === 'active'
                ? 'wave-dot--active'
                : status === 'next'
                  ? 'wave-dot--next'
                  : 'wave-dot--locked';
            const badgeClass =
              status === 'active'
                ? 'wave-status-badge--active'
                : status === 'next'
                  ? 'wave-status-badge--next'
                  : 'wave-status-badge--locked';
            const badgeLabel =
              status === 'active'
                ? 'ACTIVE FLOAT'
                : status === 'next'
                  ? 'NEXT CLIFF'
                  : 'LOCKED';

            return (
              <div key={wave.id} className="unlock-wave-row">
                <div className="wave-node-col" aria-hidden="true">
                  <span className={`wave-dot ${dotClass}`} />
                </div>

                <div className="wave-info">
                  <div className="wave-date-line">
                    <span>{wave.dateLabel}</span>
                    <span className="wave-day-tag">({wave.dayLabel})</span>
                  </div>
                  <span className="wave-shares-sub">
                    {wave.sharesMillions}M Class A shares
                  </span>
                </div>

                <span className={`wave-status-badge ${badgeClass}`}>
                  {badgeLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
