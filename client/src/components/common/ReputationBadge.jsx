/**
 * components/common/ReputationBadge.jsx — Trust Score Badge
 *
 * Reusable reputation badge showing a circular SVG score ring, tier label,
 * and an expandable breakdown panel. No external chart libraries — pure
 * inline SVG and Tailwind CSS bars.
 *
 * Props:
 *   score       — 0–100 numeric trust score
 *   tier        — 'Elite Trader' | 'Verified Partner' | 'Rising Peer' | 'High Risk'
 *   tierColor   — 'gold' | 'green' | 'blue' | 'red'
 *   breakdown   — { completionRate, totalTrades, completedTrades, averageRating, totalReviews, disputePenalty }
 *   size        — 'sm' | 'md' | 'lg' (default: 'md')
 *   showBreakdown — whether to show the expandable breakdown (default: true)
 */

import { useState } from 'react';

const COLOR_MAP = {
  gold:  { ring: '#f59e0b', bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',  barBg: 'bg-amber-500' },
  green: { ring: '#10b981', bg: 'bg-emerald-50',  text: 'text-emerald-700', border: 'border-emerald-200', barBg: 'bg-emerald-500' },
  blue:  { ring: '#3b82f6', bg: 'bg-blue-50',     text: 'text-blue-700',    border: 'border-blue-200',   barBg: 'bg-blue-500' },
  red:   { ring: '#ef4444', bg: 'bg-red-50',      text: 'text-red-700',     border: 'border-red-200',    barBg: 'bg-red-500' },
};

const SIZE_CONFIG = {
  sm: { svgSize: 56,  strokeWidth: 4,  radius: 22, fontSize: 'text-xs',  tierSize: 'text-[10px]' },
  md: { svgSize: 80,  strokeWidth: 5,  radius: 32, fontSize: 'text-base', tierSize: 'text-xs' },
  lg: { svgSize: 120, strokeWidth: 6,  radius: 48, fontSize: 'text-2xl',  tierSize: 'text-sm' },
};

const StarDisplay = ({ rating, max = 5 }) => {
  const stars = [];
  for (let i = 1; i <= max; i++) {
    if (i <= Math.floor(rating)) {
      stars.push(<span key={i} className="text-amber-400">★</span>);
    } else if (i - 0.5 <= rating) {
      stars.push(<span key={i} className="text-amber-400">★</span>);
    } else {
      stars.push(<span key={i} className="text-concrete-300">★</span>);
    }
  }
  return <span className="inline-flex gap-0.5 text-sm">{stars}</span>;
};

const ProgressBar = ({ value, max = 100, colorClass = 'bg-navy-800' }) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="h-2 w-full rounded-full bg-concrete-100 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out ${colorClass}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};

const ReputationBadge = ({
  score = 0,
  tier = 'High Risk',
  tierColor = 'red',
  breakdown = {},
  size = 'md',
  showBreakdown = true,
}) => {
  const [expanded, setExpanded] = useState(false);

  const colors = COLOR_MAP[tierColor] || COLOR_MAP.red;
  const cfg    = SIZE_CONFIG[size] || SIZE_CONFIG.md;

  // SVG circle math
  const circumference = 2 * Math.PI * cfg.radius;
  const progress      = (score / 100) * circumference;
  const dashOffset    = circumference - progress;

  return (
    <div className="flex flex-col items-center gap-2">
      {/* ── Score Ring ──────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => showBreakdown && setExpanded(!expanded)}
        className={`relative group focus:outline-none ${showBreakdown ? 'cursor-pointer' : 'cursor-default'}`}
        aria-label={`Trust score: ${score}, tier: ${tier}`}
      >
        <svg
          width={cfg.svgSize}
          height={cfg.svgSize}
          viewBox={`0 0 ${cfg.svgSize} ${cfg.svgSize}`}
          className="transform -rotate-90"
        >
          {/* Background track */}
          <circle
            cx={cfg.svgSize / 2}
            cy={cfg.svgSize / 2}
            r={cfg.radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={cfg.strokeWidth}
          />
          {/* Score arc */}
          <circle
            cx={cfg.svgSize / 2}
            cy={cfg.svgSize / 2}
            r={cfg.radius}
            fill="none"
            stroke={colors.ring}
            strokeWidth={cfg.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Score number centered inside the ring */}
        <span
          className={`absolute inset-0 flex items-center justify-center font-bold ${cfg.fontSize} text-slate-950`}
        >
          {score}
        </span>

        {/* Hover glow */}
        {showBreakdown && (
          <span
            className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            style={{ boxShadow: `0 0 16px ${colors.ring}33` }}
          />
        )}
      </button>

      {/* ── Tier Label ─────────────────────────────────────────────────── */}
      <span
        className={`inline-flex items-center gap-1 rounded px-2.5 py-1 font-semibold ${cfg.tierSize} ${colors.bg} ${colors.text} ${colors.border} border`}
      >
        {tier}
      </span>

      {/* ── Expandable Breakdown Panel ─────────────────────────────────── */}
      {showBreakdown && expanded && (
        <div className={`w-full max-w-sm mt-3 rounded-lg border ${colors.border} ${colors.bg} p-4 space-y-4 animate-in`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-steel-500">
            Score Breakdown
          </p>

          {/* Completion Rate */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-slate-700">Completion Rate</span>
              <span className="text-xs font-bold text-slate-950">
                {breakdown.completionRate?.toFixed(1) ?? 0}%
              </span>
            </div>
            <ProgressBar value={breakdown.completionRate || 0} colorClass={colors.barBg} />
            <p className="mt-1 text-[10px] text-steel-400">
              {breakdown.completedTrades ?? 0} completed of {breakdown.totalTrades ?? 0} total trades · Weight: 40%
            </p>
          </div>

          {/* Average Rating */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-slate-700">Average Rating</span>
              <span className="text-xs font-bold text-slate-950">
                {breakdown.averageRating?.toFixed(2) ?? '0.00'} / 5
              </span>
            </div>
            <StarDisplay rating={breakdown.averageRating || 0} />
            <p className="mt-1 text-[10px] text-steel-400">
              {breakdown.totalReviews ?? 0} reviews received · Weight: 40%
            </p>
          </div>

          {/* Dispute Penalty */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-slate-700">Dispute Penalty</span>
              <span className="text-xs font-bold text-slate-950">
                -{breakdown.disputePenalty ?? 0} pts
              </span>
            </div>
            <ProgressBar value={breakdown.disputePenalty || 0} colorClass="bg-red-400" />
            <p className="mt-1 text-[10px] text-steel-400">
              Weight: 20% · No disputes recorded
            </p>
          </div>

          {/* Formula */}
          <div className="rounded border border-concrete-200 bg-white/60 p-3">
            <p className="text-[10px] font-mono text-steel-600 leading-relaxed">
              Score = (Completion × 0.40) + (Rating × 0.40) + ((100 − Penalty) × 0.20)
            </p>
            <p className="mt-1 text-[10px] text-steel-400">
              Time-decay applied: W(t) = e<sup>−0.015 × days</sup> (half-life ≈ 46 days)
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReputationBadge;
