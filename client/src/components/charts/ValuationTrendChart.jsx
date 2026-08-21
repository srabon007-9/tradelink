/**
 * components/charts/ValuationTrendChart.jsx — SVG Line Chart
 *
 * Pure inline SVG line chart for displaying historical skill valuation data.
 * No external chart libraries — renders a polyline, gradient fill, axes,
 * hover tooltip, timeframe switcher, trend badge, and market signal.
 *
 * Props:
 *   slug         — category slug to fetch history for
 *   categoryName — display name of the category
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../services/api';

const RANGES = ['24h', '7d', '30d', 'all'];

const RANGE_LABELS = { '24h': '24H', '7d': '7D', '30d': '30D', 'all': 'MAX' };

const CHART_W = 800;
const CHART_H = 300;
const PAD = { top: 30, right: 80, bottom: 40, left: 70 };

const INNER_W = CHART_W - PAD.left - PAD.right;
const INNER_H = CHART_H - PAD.top - PAD.bottom;

const fmtPrice = (n) =>
  new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(n);

const fmtDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-BD', { month: 'short', day: 'numeric' });
};

const fmtDateTime = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-BD', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const ValuationTrendChart = ({ slug, categoryName }) => {
  const [range, setRange]             = useState('7d');
  const [data, setData]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [tooltip, setTooltip]         = useState(null);
  const svgRef                        = useRef(null);

  // Fetch history data
  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api.get(`/valuations/${slug}/history?range=${range}`)
      .then(res => setData(res.data.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [slug, range]);

  // Calculate chart coordinates from data points
  const chartPoints = useCallback(() => {
    if (!data?.dataPoints?.length) return { points: [], minY: 0, maxY: 0 };

    const prices = data.dataPoints.map(d => d.priceBDT);
    const minY = Math.min(...prices);
    const maxY = Math.max(...prices);
    const yRange = maxY - minY || 1;

    const points = data.dataPoints.map((d, i) => ({
      x: PAD.left + (i / Math.max(data.dataPoints.length - 1, 1)) * INNER_W,
      y: PAD.top + INNER_H - ((d.priceBDT - minY) / yRange) * INNER_H,
      ...d,
    }));

    return { points, minY, maxY };
  }, [data]);

  const { points, minY, maxY } = chartPoints();

  // Build polyline path string
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

  // Build fill path (closed polygon under the line)
  const fillPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${PAD.top + INNER_H} L ${points[0].x.toFixed(1)} ${PAD.top + INNER_H} Z`
    : '';

  const lineColor = data?.trendDirection === 'down' ? '#dc2626' : '#1e3a8a';
  const fillId = `gradient-${slug}`;

  // Handle mouse move for tooltip
  const handleMouseMove = (e) => {
    if (!svgRef.current || points.length === 0) return;

    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * CHART_W;

    // Find closest data point
    let closest = points[0];
    let closestDist = Infinity;

    for (const p of points) {
      const dist = Math.abs(p.x - mouseX);
      if (dist < closestDist) {
        closestDist = dist;
        closest = p;
      }
    }

    // Calculate tooltip pixel position relative to SVG container
    const tooltipX = (closest.x / CHART_W) * rect.width;
    const tooltipY = (closest.y / CHART_H) * rect.height;

    setTooltip({
      dataPoint: closest,
      pixelX: tooltipX,
      pixelY: tooltipY,
      svgX: closest.x,
      svgY: closest.y,
    });
  };

  const handleMouseLeave = () => setTooltip(null);

  // X-axis labels (first, middle, last)
  const xLabels = [];
  if (points.length >= 1) {
    xLabels.push({ x: points[0].x, label: fmtDate(points[0].timestamp) });
  }
  if (points.length >= 3) {
    const mid = Math.floor(points.length / 2);
    xLabels.push({ x: points[mid].x, label: fmtDate(points[mid].timestamp) });
  }
  if (points.length >= 2) {
    xLabels.push({ x: points[points.length - 1].x, label: fmtDate(points[points.length - 1].timestamp) });
  }

  // Y-axis labels (min, mid, max)
  const midY = (minY + maxY) / 2;
  const yLabels = [
    { y: PAD.top + INNER_H, label: fmtPrice(minY) },
    { y: PAD.top + INNER_H / 2, label: fmtPrice(midY) },
    { y: PAD.top, label: fmtPrice(maxY) },
  ];

  return (
    <div className="space-y-3">
      {/* ── Header: Category name + Timeframe Switcher + Trend Badge ──── */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-950">
          {categoryName || slug} — Price History
        </h3>

        <div className="flex items-center gap-2">
          {/* Trend badge */}
          {data && data.trendPercent !== undefined && (
            <span
              className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold ${
                data.trendDirection === 'up'
                  ? 'bg-emerald-50 text-emerald-700'
                  : data.trendDirection === 'down'
                  ? 'bg-red-50 text-red-700'
                  : 'bg-concrete-50 text-steel-600'
              }`}
            >
              {data.trendPercent > 0 ? '+' : ''}{data.trendPercent}%
              {data.trendDirection === 'up' ? ' ↑' : data.trendDirection === 'down' ? ' ↓' : ''}
            </span>
          )}

          {/* Timeframe pills */}
          <div className="flex rounded-md border border-concrete-200 overflow-hidden">
            {RANGES.map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1 text-xs font-semibold transition-colors ${
                  range === r
                    ? 'bg-navy-800 text-white'
                    : 'bg-white text-steel-600 hover:bg-concrete-50'
                }`}
              >
                {RANGE_LABELS[r]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Chart SVG ─────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-sm text-steel-500">
          Loading chart data…
        </div>
      ) : !data || points.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-sm text-steel-500">
          No historical data available for this timeframe.
        </div>
      ) : (
        <div className="relative">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
            width="100%"
            className="overflow-visible"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {/* Gradient definition */}
            <defs>
              <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={lineColor} stopOpacity="0.15" />
                <stop offset="100%" stopColor={lineColor} stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Horizontal grid lines */}
            {yLabels.map((yl, i) => (
              <line
                key={i}
                x1={PAD.left}
                y1={yl.y}
                x2={PAD.left + INNER_W}
                y2={yl.y}
                stroke="#e5e7eb"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            ))}

            {/* Fill under the line */}
            {fillPath && (
              <path d={fillPath} fill={`url(#${fillId})`} />
            )}

            {/* Data line */}
            {linePath && (
              <path d={linePath} fill="none" stroke={lineColor} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            )}

            {/* Data point dots (only show if <= 30 points for readability) */}
            {points.length <= 30 && points.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r="3"
                fill="white"
                stroke={lineColor}
                strokeWidth="2"
              />
            ))}

            {/* Y-axis labels */}
            {yLabels.map((yl, i) => (
              <text
                key={i}
                x={PAD.left - 8}
                y={yl.y + 4}
                textAnchor="end"
                className="fill-steel-400"
                fontSize="11"
                fontFamily="Inter, sans-serif"
              >
                {yl.label}
              </text>
            ))}

            {/* X-axis labels */}
            {xLabels.map((xl, i) => (
              <text
                key={i}
                x={xl.x}
                y={PAD.top + INNER_H + 24}
                textAnchor="middle"
                className="fill-steel-400"
                fontSize="11"
                fontFamily="Inter, sans-serif"
              >
                {xl.label}
              </text>
            ))}

            {/* Hover guideline */}
            {tooltip && (
              <>
                <line
                  x1={tooltip.svgX}
                  y1={PAD.top}
                  x2={tooltip.svgX}
                  y2={PAD.top + INNER_H}
                  stroke={lineColor}
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  opacity="0.5"
                />
                <circle
                  cx={tooltip.svgX}
                  cy={tooltip.svgY}
                  r="5"
                  fill={lineColor}
                  stroke="white"
                  strokeWidth="2"
                />
              </>
            )}
          </svg>

          {/* Tooltip popup (HTML, positioned absolutely) */}
          {tooltip && (
            <div
              className="absolute z-10 pointer-events-none rounded-lg border border-concrete-200 bg-white shadow-card px-3 py-2 text-xs"
              style={{
                left: `${Math.min(tooltip.pixelX + 12, svgRef.current?.getBoundingClientRect().width - 160)}px`,
                top: `${Math.max(tooltip.pixelY - 60, 0)}px`,
              }}
            >
              <p className="font-bold text-slate-950">{fmtPrice(tooltip.dataPoint.priceBDT)}</p>
              <p className="text-steel-500 mt-0.5">
                Demand: {tooltip.dataPoint.demand} · Supply: {tooltip.dataPoint.supply}
              </p>
              <p className="text-steel-400 mt-0.5">{fmtDateTime(tooltip.dataPoint.timestamp)}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Market Signal Banner ──────────────────────────────────────── */}
      {data?.marketSignal && (
        <div
          className={`rounded-lg border px-4 py-2.5 text-xs font-medium ${
            data.trendDirection === 'up'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : data.trendDirection === 'down'
              ? 'border-red-200 bg-red-50 text-red-800'
              : 'border-concrete-200 bg-concrete-50 text-steel-600'
          }`}
        >
          {data.marketSignal}
        </div>
      )}
    </div>
  );
};

export default ValuationTrendChart;
