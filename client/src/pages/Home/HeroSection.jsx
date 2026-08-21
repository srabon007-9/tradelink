/**
 * pages/Home/HeroSection.jsx — First viewport platform introduction.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';
import { ROUTES } from '../../constants';

const HeroSection = () => {
  const { isLoggedIn, user } = useAuth();
  const [memberCount, setMemberCount] = useState(null);
  const profileButtonLabel = user?.name || (user?.role ? `${user.role} Profile` : 'My Profile');

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
      <div className="container-xl py-14 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
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

        {/* ── Lower Middle Hero Action Button ──────────────────────────────── */}
        <div className="mt-12 flex flex-col items-center justify-center gap-4 border-t border-concrete-200 pt-10 text-center sm:flex-row">
          {isLoggedIn ? (
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                to={ROUTES.DASHBOARD}
                className="inline-flex items-center justify-center gap-3 rounded-xl bg-navy-900 px-8 py-4 text-base font-bold text-white shadow-lg transition-all duration-200 hover:bg-navy-800 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>Go to Member Dashboard</span>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                to={ROUTES.PROFILE}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-navy-800 bg-white px-8 py-4 text-base font-semibold text-navy-900 shadow-sm transition-all duration-200 hover:bg-navy-50 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
              >
                <svg className="h-5 w-5 text-navy-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>{profileButtonLabel}</span>
              </Link>
            </div>
          ) : (
            <>
              <Link
                to={ROUTES.REGISTER}
                className="inline-flex items-center justify-center gap-3 rounded-xl bg-navy-900 px-10 py-4 text-base font-bold text-white shadow-lg transition-all duration-200 hover:bg-navy-800 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>Join TradeLink Now</span>
              </Link>
              <Link
                to={ROUTES.BROWSE}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-concrete-300 bg-white px-8 py-4 text-base font-semibold text-steel-800 shadow-sm transition-all duration-200 hover:border-concrete-400 hover:bg-concrete-50"
              >
                <span>Browse Skill Directory</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
