/**
 * pages/Home/HeroSection.jsx — First viewport platform introduction.
 */

import { useEffect, useState } from 'react';
import api from '../../services/api';

const HeroSection = () => {
  const [memberCount, setMemberCount] = useState(null);

  useEffect(() => {
    api.get('/users')
      .then(res => setMemberCount(res.data.data.length))
      .catch(() => setMemberCount(0));
  }, []);

  const STATS = [
    { value: memberCount !== null ? `${memberCount}` : '…', label: 'Registered members' },
    { value: '24', label: 'Skill categories' },
    { value: '0', label: 'Open requests' },
    { value: '100%', label: 'Live data' },
  ];

  return (
    <section className="border-b border-concrete-200 bg-white pt-28" aria-labelledby="hero-headline">
      <div className="container-xl grid gap-10 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">
        <div>
          <span className="eyebrow mb-4">Skill Barter Marketplace</span>
          <h1 id="hero-headline" className="max-w-3xl text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl">
            Trade skills with credits. No cash needed.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-steel-600">
            TradeLink is a skill-barter marketplace where people exchange services using a dynamic credit system — priced by real supply and demand, not self-declared rates.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {STATS.map(stat => (
              <div key={stat.label} className="border-l border-concrete-300 pl-4">
                <div className="text-2xl font-semibold text-navy-900">{stat.value}</div>
                <div className="mt-1 text-xs font-medium uppercase tracking-wide text-steel-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-card overflow-hidden">
          <div className="border-b border-concrete-200 bg-concrete-50 px-5 py-4">
            <p className="text-sm font-semibold text-slate-950">Platform Status</p>
            <p className="mt-1 text-sm text-steel-600">Live data from the database.</p>
          </div>
          <div className="space-y-5 p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-steel-600">Members on platform</p>
              <p className="mt-1 text-3xl font-semibold text-slate-950">
                {memberCount !== null ? memberCount : '…'}
              </p>
              <p className="mt-1 text-sm text-steel-600">
                {memberCount === 0
                  ? 'No members yet — be the first to register!'
                  : memberCount === 1
                  ? '1 member registered so far.'
                  : `${memberCount} members registered so far.`}
              </p>
            </div>

            <dl className="grid grid-cols-2 gap-3">
              <div className="rounded-md border border-concrete-200 bg-white p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-steel-600">Open Requests</dt>
                <dd className="mt-1 text-lg font-semibold text-slate-950">0</dd>
              </div>
              <div className="rounded-md border border-concrete-200 bg-white p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-steel-600">Active Trades</dt>
                <dd className="mt-1 text-lg font-semibold text-slate-950">0</dd>
              </div>
              <div className="rounded-md border border-concrete-200 bg-white p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-steel-600">Reviews</dt>
                <dd className="mt-1 text-lg font-semibold text-slate-950">0</dd>
              </div>
              <div className="rounded-md border border-concrete-200 bg-white p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-steel-600">Categories</dt>
                <dd className="mt-1 text-lg font-semibold text-slate-950">24</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
