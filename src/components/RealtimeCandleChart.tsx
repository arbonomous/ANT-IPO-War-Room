import { memo, useEffect, useRef, useState } from 'react';
import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  HistogramSeries,
  LineSeries,
  LineStyle,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from 'lightweight-charts';
import { IPO_CONSTANTS } from '../data/ipoData';
import {
  HyperliquidStream,
  computeEma,
  computeLatestRsi,
  computeSessionVwap,
  fetchHyperliquidCandles,
  type HlCandle,
  type HlInterval,
} from '../lib/hyperliquidFeed';

interface RealtimeCandleChartProps {
  hlCoin: string;
  expanded: boolean;
  onFallbackToTradingView: () => void;
}

const INTERVALS: HlInterval[] = ['1m', '5m', '15m', '1h'];

interface ReadoutState {
  timeLabel: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  vwap: number | null;
  ema9: number | null;
  ema21: number | null;
  rsi: number | null;
}

function formatCandleTime(unixSec: number): string {
  return new Date(unixSec * 1000).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function RealtimeCandleChartComponent({
  hlCoin,
  expanded,
  onFallbackToTradingView,
}: RealtimeCandleChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const candlesRef = useRef<HlCandle[]>([]);
  const [interval, setInterval] = useState<HlInterval>('5m');
  const [showVwap, setShowVwap] = useState(true);
  const [showEma, setShowEma] = useState(true);
  const [wsLive, setWsLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [readout, setReadout] = useState<ReadoutState | null>(null);

  const vwapSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema9SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema21SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const showVwapRef = useRef(showVwap);
  const showEmaRef = useRef(showEma);

  // Sync overlay visibility toggles without rebuilding chart
  useEffect(() => {
    showVwapRef.current = showVwap;
    vwapSeriesRef.current?.applyOptions({ visible: showVwap });
  }, [showVwap]);

  useEffect(() => {
    showEmaRef.current = showEma;
    ema9SeriesRef.current?.applyOptions({ visible: showEma });
    ema21SeriesRef.current?.applyOptions({ visible: showEma });
  }, [showEma]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    setLoading(true);
    setLoadError(null);
    candlesRef.current = [];

    const chart: IChartApi = createChart(el, {
      layout: {
        background: { type: ColorType.Solid, color: '#0E1015' },
        textColor: '#9AA3B2',
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(38, 43, 54, 0.42)' },
        horzLines: { color: 'rgba(38, 43, 54, 0.42)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: 'rgba(230, 233, 239, 0.22)',
          labelBackgroundColor: '#262B36',
        },
        horzLine: {
          color: 'rgba(230, 233, 239, 0.22)',
          labelBackgroundColor: '#262B36',
        },
      },
      rightPriceScale: {
        borderColor: '#262B36',
        scaleMargins: { top: 0.08, bottom: 0.22 },
      },
      timeScale: {
        borderColor: '#262B36',
        timeVisible: true,
        secondsVisible: false,
      },
      width: el.clientWidth,
      height: el.clientHeight,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#34B889',
      downColor: '#DF6A73',
      borderVisible: false,
      wickUpColor: '#34B889',
      wickDownColor: '#DF6A73',
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 },
    });

    const vwapSeries = chart.addSeries(LineSeries, {
      color: '#DBA54C',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      visible: showVwapRef.current,
    });
    vwapSeriesRef.current = vwapSeries;

    const ema9Series = chart.addSeries(LineSeries, {
      color: '#5CC8A1',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      visible: showEmaRef.current,
    });
    ema9SeriesRef.current = ema9Series;

    const ema21Series = chart.addSeries(LineSeries, {
      color: '#73A8E8',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      visible: showEmaRef.current,
    });
    ema21SeriesRef.current = ema21Series;

    // Add key ANT IPO reference lines on chart
    if (hlCoin === 'xyz:ANT') {
      candleSeries.createPriceLine({
        price: IPO_CONSTANTS.ipoOfferPrice,
        color: '#34B889',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: 'IPO $83',
      });
      candleSeries.createPriceLine({
        price: IPO_CONSTANTS.s1RangeHigh,
        color: '#DBA54C',
        lineWidth: 1,
        lineStyle: LineStyle.Dotted,
        axisLabelVisible: true,
        title: 'S-1 $78',
      });
      candleSeries.createPriceLine({
        price: IPO_CONSTANTS.s1RangeLow,
        color: '#DF6A73',
        lineWidth: 1,
        lineStyle: LineStyle.Dotted,
        axisLabelVisible: true,
        title: 'S-1 $70',
      });
    }

    const updateReadoutFromCandles = (list: HlCandle[], targetTime?: number) => {
      if (list.length === 0) return;
      const idx =
        targetTime !== undefined
          ? list.findIndex((c) => c.time === targetTime)
          : list.length - 1;
      const resolvedIdx = idx >= 0 ? idx : list.length - 1;
      const c = list[resolvedIdx];
      const vwapArr = computeSessionVwap(list);
      const ema9Arr = computeEma(list, 9);
      const ema21Arr = computeEma(list, 21);
      const rsi = computeLatestRsi(list.slice(0, resolvedIdx + 1), 14);

      setReadout({
        timeLabel: formatCandleTime(c.time),
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume,
        vwap: vwapArr[resolvedIdx]?.value ?? null,
        ema9: ema9Arr[resolvedIdx]?.value ?? null,
        ema21: ema21Arr[resolvedIdx]?.value ?? null,
        rsi,
      });
    };

    const syncAllSeries = (list: HlCandle[], fit = false) => {
      candleSeries.setData(
        list.map((c) => ({
          time: c.time as UTCTimestamp,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        })),
      );
      volumeSeries.setData(
        list.map((c) => ({
          time: c.time as UTCTimestamp,
          value: c.volume,
          color:
            c.close >= c.open
              ? 'rgba(52, 184, 137, 0.28)'
              : 'rgba(223, 106, 115, 0.28)',
        })),
      );
      vwapSeries.setData(
        computeSessionVwap(list).map((p) => ({
          time: p.time as UTCTimestamp,
          value: p.value,
        })),
      );
      ema9Series.setData(
        computeEma(list, 9).map((p) => ({
          time: p.time as UTCTimestamp,
          value: p.value,
        })),
      );
      ema21Series.setData(
        computeEma(list, 21).map((p) => ({
          time: p.time as UTCTimestamp,
          value: p.value,
        })),
      );

      if (fit) {
        chart.timeScale().fitContent();
      }
      updateReadoutFromCandles(list);
    };

    chart.subscribeCrosshairMove((param) => {
      const list = candlesRef.current;
      if (!param.time || typeof param.time !== 'number') {
        updateReadoutFromCandles(list);
      } else {
        updateReadoutFromCandles(list, param.time);
      }
    });

    const controller = new AbortController();
    let stream: HyperliquidStream | null = null;

    void fetchHyperliquidCandles(hlCoin, interval, 220, controller.signal)
      .then((initial) => {
        if (controller.signal.aborted) return;
        if (initial.length === 0) {
          setLoadError(`No live candles returned for ${hlCoin}.`);
          setLoading(false);
          return;
        }
        candlesRef.current = initial;
        syncAllSeries(initial, true);
        setLoading(false);

        stream = new HyperliquidStream(
          hlCoin,
          {
            onStatus: setWsLive,
            onCandle: (incoming) => {
              const list = candlesRef.current;
              if (list.length === 0) return;
              const last = list[list.length - 1];
              let next: HlCandle[];
              if (incoming.time === last.time) {
                next = [...list.slice(0, -1), incoming];
              } else if (incoming.time > last.time) {
                next = [...list, incoming].slice(-300);
              } else {
                return;
              }
              candlesRef.current = next;

              candleSeries.update({
                time: incoming.time as UTCTimestamp,
                open: incoming.open,
                high: incoming.high,
                low: incoming.low,
                close: incoming.close,
              });
              volumeSeries.update({
                time: incoming.time as UTCTimestamp,
                value: incoming.volume,
                color:
                  incoming.close >= incoming.open
                    ? 'rgba(52, 184, 137, 0.28)'
                    : 'rgba(223, 106, 115, 0.28)',
              });
              const vwapArr = computeSessionVwap(next);
              const ema9Arr = computeEma(next, 9);
              const ema21Arr = computeEma(next, 21);
              const lastVwap = vwapArr[vwapArr.length - 1];
              const lastEma9 = ema9Arr[ema9Arr.length - 1];
              const lastEma21 = ema21Arr[ema21Arr.length - 1];
              if (lastVwap) {
                vwapSeries.update({
                  time: lastVwap.time as UTCTimestamp,
                  value: lastVwap.value,
                });
              }
              if (lastEma9) {
                ema9Series.update({
                  time: lastEma9.time as UTCTimestamp,
                  value: lastEma9.value,
                });
              }
              if (lastEma21) {
                ema21Series.update({
                  time: lastEma21.time as UTCTimestamp,
                  value: lastEma21.value,
                });
              }
              updateReadoutFromCandles(next);
            },
          },
          interval,
        );
        stream.connect();
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setLoadError('Live Hyperliquid feed unavailable on this network.');
          setLoading(false);
        }
      });

    const resizeObs = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    });
    resizeObs.observe(el);

    return () => {
      controller.abort();
      stream?.destroy();
      resizeObs.disconnect();
      vwapSeriesRef.current = null;
      ema9SeriesRef.current = null;
      ema21SeriesRef.current = null;
      chart.remove();
    };
  }, [hlCoin, interval]);

  const isUp = readout ? readout.close >= readout.open : true;

  return (
    <div className="rt-chart-shell">
      {/* Compact Real-Time Sub-Toolbar & Live OHLC Readout */}
      <div className="rt-chart-subbar">
        <div className="rt-controls-group">
          <div className="interval-tabs" role="tablist" aria-label="Real-time candle interval">
            {INTERVALS.map((iv) => (
              <button
                key={iv}
                type="button"
                role="tab"
                aria-selected={interval === iv}
                className={`interval-tab${interval === iv ? ' active' : ''}`}
                onClick={() => setInterval(iv)}
              >
                {iv}
              </button>
            ))}
          </div>

          <button
            type="button"
            className={`rt-overlay-pill${showVwap ? ' rt-overlay-pill--amber' : ''}`}
            onClick={() => setShowVwap((v) => !v)}
          >
            VWAP
          </button>
          <button
            type="button"
            className={`rt-overlay-pill${showEma ? ' rt-overlay-pill--emerald' : ''}`}
            onClick={() => setShowEma((v) => !v)}
          >
            EMA 9/21
          </button>

          <span className={`rt-ws-pill mono${wsLive ? ' rt-ws-pill--live' : ''}`}>
            {wsLive ? '● STREAMING' : '○ SYNCING'}
          </span>
        </div>

        {readout && (
          <div className="rt-ohlc-strip mono">
            <span className="rt-ohlc-time">{readout.timeLabel}</span>
            <span>
              O <strong>{readout.open.toFixed(2)}</strong>
            </span>
            <span>
              H <strong className="text-emerald">{readout.high.toFixed(2)}</strong>
            </span>
            <span>
              L <strong className="text-crimson">{readout.low.toFixed(2)}</strong>
            </span>
            <span>
              C{' '}
              <strong className={isUp ? 'text-emerald' : 'text-crimson'}>
                {readout.close.toFixed(2)}
              </strong>
            </span>
            {readout.vwap !== null && (
              <span className="text-amber">VWAP {readout.vwap.toFixed(2)}</span>
            )}
            {readout.rsi !== null && (
              <span className="rt-rsi-val">RSI {readout.rsi.toFixed(1)}</span>
            )}
          </div>
        )}
      </div>

      {/* Chart Canvas */}
      <div
        className={`rt-canvas-frame${expanded ? ' rt-canvas-frame--expanded' : ''}`}
      >
        <div ref={containerRef} className="rt-canvas-host" />

        {loading && (
          <div className="rt-overlay-state mono">
            Connecting to Hyperliquid 0-delay {hlCoin} stream…
          </div>
        )}

        {!loading && loadError && (
          <div className="rt-overlay-state mono">
            <span>{loadError}</span>
            <button
              type="button"
              className="ipo-notice-peer-btn mono"
              onClick={onFallbackToTradingView}
            >
              Switch to TradingView Chart
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export const RealtimeCandleChart = memo(RealtimeCandleChartComponent);
