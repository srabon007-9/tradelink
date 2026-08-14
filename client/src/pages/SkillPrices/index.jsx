/**
 * pages/SkillPrices/index.jsx — Live Skill Market Prices
 *
 * Shows all skill categories with their current BDT price,
 * demand, supply, and a live price direction indicator.
 */

import { useEffect, useState } from 'react';
import api from '../../services/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n) =>
  new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(n);

const PriceBar = ({ value, floor = 500, ceiling = 10000 }) => {
  const pct = Math.round(((value - floor) / (ceiling - floor)) * 100);
  const color =
    pct > 70 ? '#ef4444' : pct > 40 ? '#f59e0b' : '#22c55e';
  return (
    <div className="h-1.5 w-full rounded bg-concrete-100">
      <div className="h-1.5 rounded transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
};

const Trend = ({ ratio }) => {
  if (ratio > 1.1) return <span className="text-xs font-bold text-red-500">↑ High demand</span>;
  if (ratio < 0.9) return <span className="text-xs font-bold text-green-600">↓ Low demand</span>;
  return <span className="text-xs font-bold text-amber-500">→ Balanced</span>;
};

// ─── Component ────────────────────────────────────────────────────────────────

const SkillPrices = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/valuations')
      .then(res => {
        setCategories(res.data.data);
        setLastUpdated(new Date());
      })
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="eyebrow mb-2">Dynamic Valuation Engine</span>
          <h1 className="text-3xl font-semibold text-slate-950">Live Skill Market Prices</h1>
          <p className="mt-2 text-sm text-steel-600">
            Prices adjust automatically based on real-time supply and demand.
            {lastUpdated && (
              <span className="ml-2 text-xs text-steel-400">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={load}
          className="btn-ghost self-start sm:self-auto"
          disabled={loading}
        >
          {loading ? 'Refreshing…' : '⟳ Refresh'}
        </button>
      </div>

      {/* ── Summary Cards ──────────────────────────────────────────── */}
      {!loading && categories.length > 0 && (() => {
        const sorted = [...categories].sort((a, b) => b.priceBDT - a.priceBDT);
        const most   = sorted[0];
        const least  = sorted[sorted.length - 1];
        const highDemand = [...categories].sort((a, b) => b.demand - a.demand)[0];
        return (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { label: 'Highest Priced', name: most.name,       value: fmt(most.priceBDT),       sub: `৳${most.floor}–৳${most.ceiling} range` },
              { label: 'Lowest Priced',  name: least.name,      value: fmt(least.priceBDT),      sub: `৳${least.floor}–৳${least.ceiling} range` },
              { label: 'Most In Demand', name: highDemand.name, value: `${highDemand.demand} requests`, sub: `${highDemand.supply} providers available` },
            ].map(card => (
              <div key={card.label} className="surface-card p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-steel-500">{card.label}</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{card.name}</p>
                <p className="mt-1 text-2xl font-bold text-navy-900">{card.value}</p>
                <p className="mt-1 text-xs text-steel-500">{card.sub}</p>
              </div>
            ))}
          </div>
        );
      })()}

      {/* ── Main Table ─────────────────────────────────────────────── */}
      <section className="surface-card overflow-hidden">
        <div className="border-b border-concrete-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-950">All Skill Categories</h2>
          <p className="mt-1 text-sm text-steel-600">
            Price = base rate × ((demand + 1) ÷ (supply + 1))^0.5, clamped between floor and ceiling.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-steel-500">
            Loading prices…
          </div>
        ) : categories.length === 0 ? (
          <div className="py-16 text-center text-sm text-steel-500">No categories found.</div>
        ) : (
          <>
            {/* Table Header */}
            <div className="hidden grid-cols-[2fr_1fr_0.7fr_0.7fr_1.2fr_1.4fr] gap-4 border-b border-concrete-200 bg-concrete-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-steel-500 md:grid">
              <span>Skill Category</span>
              <span>Live Price</span>
              <span>Demand</span>
              <span>Supply</span>
              <span>Trend</span>
              <span>Price Position</span>
            </div>

            <div className="divide-y divide-concrete-200">
              {categories.map(cat => {
                const ratio = cat.demand / Math.max(cat.supply, 1);
                const snap  = cat.lastSnapshot;
                return (
                  <div
                    key={cat._id}
                    className="grid gap-3 px-5 py-4 md:grid-cols-[2fr_1fr_0.7fr_0.7fr_1.2fr_1.4fr] md:items-center"
                  >
                    {/* Name + Description */}
                    <div>
                      <p className="font-semibold text-slate-950">{cat.name}</p>
                      <p className="mt-0.5 text-xs text-steel-500 line-clamp-1">{cat.description}</p>
                    </div>

                    {/* Live Price */}
                    <div>
                      <p className="text-lg font-bold text-navy-900">{fmt(cat.priceBDT)}</p>
                    </div>

                    {/* Demand */}
                    <div className="text-center md:text-left">
                      <p className="text-lg font-semibold text-slate-950">{cat.demand}</p>
                      <p className="text-xs text-steel-400">requests</p>
                    </div>

                    {/* Supply */}
                    <div className="text-center md:text-left">
                      <p className="text-lg font-semibold text-slate-950">{cat.supply}</p>
                      <p className="text-xs text-steel-400">providers</p>
                    </div>

                    {/* Trend */}
                    <div className="space-y-1">
                      <Trend ratio={ratio} />
                      <p className="text-xs text-steel-400">ratio {ratio.toFixed(2)}</p>
                    </div>

                    {/* Price Bar */}
                    <div className="space-y-1">
                      <PriceBar value={cat.priceBDT} floor={cat.floor} ceiling={cat.ceiling} />
                      <div className="flex justify-between text-[10px] text-steel-400">
                        <span>৳{cat.floor.toLocaleString()} floor</span>
                        <span>৳{cat.ceiling.toLocaleString()} ceiling</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* ── Formula Note ───────────────────────────────────────────── */}
      <div className="rounded-lg border border-concrete-200 bg-concrete-50 p-4 text-xs text-steel-500">
        <span className="font-semibold text-steel-700">How prices are calculated: </span>
        Price = each category's own base rate × ((open requests + 1) ÷ (active providers + 1))^0.5 —
        clamped between that category's floor and ceiling (5× its base rate).
        Prices recalculate automatically every 15 minutes and instantly on any supply or demand change.
      </div>

    </div>
  );
};

export default SkillPrices;
