/**
 * components/charts/ValuationComparisonChart.jsx — Dual-Line SVG Comparison Chart
 *
 * Renders two skill categories on the same SVG chart in different colors
 * for side-by-side price comparison. Includes category selector, timeframe
 * switcher, and hover tooltips.
 *
 * Props:
 *   categories — array of category objects from GET /api/valuations (needs { name, slug })
 */

import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';

const RANGES = ['24h', '7d', '30d', 'all'];
const RANGE_LABELS = { '24h': '24H', '7d': '7D', '30d': '30D', 'all': 'MAX' };

const CHART_W = 800;
const CHART_H = 300;
const PAD = { top: 30, right: 80, bottom: 40, left: 70 };
const INNER_W = CHART_W - PAD.left - PAD.right;
const INNER_H = CHART_H - PAD.top - PAD.bottom;

const LINE_COLORS = ['#1e3a8a', '#d97706'];
const LINE_NAMES  = ['Navy', 'Amber'];

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

const ValuationComparisonChart = ({ categories = [] }) => {
  const [range, setRange]       = useState('7d');
  const [slugA, setSlugA]       = useState('');
  const [slugB, setSlugB]       = useState('');
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [tooltip, setTooltip]   = useState(null);
  const svgRef                  = useRef(null);

  // Default to top 2 categories by price
  useEffect(() => {
    if (categories.length >= 2 && !slugA && !slugB) {
      setSlugA(categories[0].slug);
      setSlugB(categories[1].slug);
    } else if (categories.length === 1 && !slugA) {
      setSlugA(categories[0].slug);
    }
  }, [categories, slugA, slugB]);

  // Fetch comparison data
  useEffect(() => {
    if (!slugA) return;

    const slugsParam = [slugA, slugB].filter(Boolean).join(',');
    setLoading(true);

    api.get(`/valuations/compare?slugs=${slugsParam}&range=${range}`)
      .then(res => setDatasets(res.data.data.datasets || []))
      .catch(() => setDatasets([]))
      .finally(() => setLoading(false));
  }, [slugA, slugB, range]);

  // Calculate chart coordinates across all datasets
  const allPrices = datasets.flatMap(ds => ds.dataPoints.map(d => d.priceBDT));
  const globalMin = allPrices.length > 0 ? Math.min(...allPrices) : 0;
  const globalMax = allPrices.length > 0 ? Math.max(...allPrices) : 1;
  const yRange    = globalMax - globalMin || 1;

  // Convert data points to SVG coordinates per dataset
  const chartDatasets = datasets.map((ds, dsIdx) => {
    const points = ds.dataPoints.map((d, i) => ({
      x: PAD.left + (i / Math.max(ds.dataPoints.length - 1, 1)) * INNER_W,
      y: PAD.top + INNER_H - ((d.priceBDT - globalMin) / yRange) * INNER_H,
      ...d,
    }));

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

    return {
      ...ds,
      points,
      linePath,
      color: LINE_COLORS[dsIdx] || LINE_COLORS[0],
    };
  });

  // Y-axis labels
  const midY = (globalMin + globalMax) / 2;
  const yLabels = [
    { y: PAD.top + INNER_H, label: fmtPrice(globalMin) },
    { y: PAD.top + INNER_H / 2, label: fmtPrice(midY) },
    { y: PAD.top, label: fmtPrice(globalMax) },
  ];

  // X-axis labels from the longest dataset
  const longestDs = chartDatasets.reduce((a, b) => (a.points.length >= b.points.length ? a : b), { points: [] });
  const xLabels = [];
  if (longestDs.points.length >= 1) {
    xLabels.push({ x: longestDs.points[0].x, label: fmtDate(longestDs.points[0].timestamp) });
  }
  if (longestDs.points.length >= 3) {
    const mid = Math.floor(longestDs.points.length / 2);
    xLabels.push({ x: longestDs.points[mid].x, label: fmtDate(longestDs.points[mid].timestamp) });
  }
  if (longestDs.points.length >= 2) {
    const last = longestDs.points[longestDs.points.length - 1];
    xLabels.push({ x: last.x, label: fmtDate(last.timestamp) });
  }

  // Hover handler
  const handleMouseMove = (e) => {
    if (!svgRef.current || chartDatasets.length === 0) return;

    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * CHART_W;

    // Find closest point across all datasets
    const closest = [];
    for (const ds of chartDatasets) {
      let best = ds.points[0];
      let bestDist = Infinity;
      for (const p of ds.points) {
        const dist = Math.abs(p.x - mouseX);
        if (dist < bestDist) {
          bestDist = dist;
          best = p;
        }
      }
      if (best) {
        closest.push({ ...best, name: ds.name, color: ds.color });
      }
    }

    if (closest.length > 0) {
      const avgX = closest.reduce((s, c) => s + c.x, 0) / closest.length;
      const pixelX = (avgX / CHART_W) * rect.width;

      setTooltip({
        svgX: avgX,
        pixelX,
        pixelY: 20,
        items: closest,
      });
    }
  };

  const handleMouseLeave = () => setTooltip(null);

  return (
    <div className="space-y-4">
      {/* ── Header: Selectors + Timeframe ─────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Skill A selector */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wide text-steel-500 mb-1">
              Skill A
            </label>
            <select
              value={slugA}
              onChange={e => setSlugA(e.target.value)}
              className="input-base py-1.5 text-xs min-w-[160px]"
            >
              <option value="">Select…</option>
              {categories.map(c => (
                <option key={c.slug} value={c.slug} disabled={c.slug === slugB}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <span className="text-steel-400 text-sm font-medium mt-5">vs</span>

          {/* Skill B selector */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wide text-steel-500 mb-1">
              Skill B
            </label>
            <select
              value={slugB}
              onChange={e => setSlugB(e.target.value)}
              className="input-base py-1.5 text-xs min-w-[160px]"
            >
              <option value="">Select…</option>
              {categories.map(c => (
                <option key={c.slug} value={c.slug} disabled={c.slug === slugA}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

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

      {/* ── Legend ─────────────────────────────────────────────────────── */}
      {chartDatasets.length > 0 && (
        <div className="flex flex-wrap gap-4">
          {chartDatasets.map((ds, i) => (
            <div key={ds.slug} className="flex items-center gap-2 text-xs">
              <span
                className="inline-block h-2.5 w-5 rounded"
                style={{ backgroundColor: ds.color }}
              />
              <span className="font-semibold text-slate-700">{ds.name}</span>
              {ds.trendPercent !== undefined && (
                <span
                  className={`font-bold ${
                    ds.trendDirection === 'up' ? 'text-emerald-600' : ds.trendDirection === 'down' ? 'text-red-600' : 'text-steel-500'
                  }`}
                >
                  {ds.trendPercent > 0 ? '+' : ''}{ds.trendPercent}%
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Chart SVG ─────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-sm text-steel-500">
          Loading comparison data…
        </div>
      ) : chartDatasets.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-sm text-steel-500">
          Select two skills above to compare their price trends.
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
            {/* Grid lines */}
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

            {/* Gradient fills */}
            <defs>
              {chartDatasets.map((ds, i) => (
                <linearGradient key={ds.slug} id={`cmp-grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={ds.color} stopOpacity="0.1" />
                  <stop offset="100%" stopColor={ds.color} stopOpacity="0.01" />
                </linearGradient>
              ))}
            </defs>

            {/* Lines + fills */}
            {chartDatasets.map((ds, i) => {
              const fill = ds.points.length > 0
                ? `${ds.linePath} L ${ds.points[ds.points.length - 1].x.toFixed(1)} ${PAD.top + INNER_H} L ${ds.points[0].x.toFixed(1)} ${PAD.top + INNER_H} Z`
                : '';
              return (
                <g key={ds.slug}>
                  {fill && <path d={fill} fill={`url(#cmp-grad-${i})`} />}
                  <path d={ds.linePath} fill="none" stroke={ds.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                </g>
              );
            })}

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
              <line
                x1={tooltip.svgX}
                y1={PAD.top}
                x2={tooltip.svgX}
                y2={PAD.top + INNER_H}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity="0.6"
              />
            )}

            {/* Hover dots */}
            {tooltip?.items.map((item, i) => (
              <circle
                key={i}
                cx={item.x}
                cy={item.y}
                r="5"
                fill={item.color}
                stroke="white"
                strokeWidth="2"
              />
            ))}
          </svg>

          {/* Tooltip popup */}
          {tooltip && (
            <div
              className="absolute z-10 pointer-events-none rounded-lg border border-concrete-200 bg-white shadow-card px-3 py-2 text-xs"
              style={{
                left: `${Math.min(tooltip.pixelX + 12, (svgRef.current?.getBoundingClientRect().width || 600) - 180)}px`,
                top: '8px',
              }}
            >
              {tooltip.items.map((item, i) => (
                <div key={i} className={i > 0 ? 'mt-1.5 pt-1.5 border-t border-concrete-100' : ''}>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="font-bold text-slate-950">{item.name}</span>
                  </div>
                  <p className="text-steel-600 mt-0.5">{fmtPrice(item.priceBDT)}</p>
                  <p className="text-steel-400">{fmtDateTime(item.timestamp)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ValuationComparisonChart;
