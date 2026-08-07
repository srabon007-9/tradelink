/**
 * pages/Home/HeroSection.jsx — First viewport platform introduction.
 */

import { Link } from 'react-router-dom';
import { SKILL_LISTINGS, ROUTES } from '../../constants';

const STATS = [
  { value: '120+', label: 'Sample members' },
  { value: '24', label: 'Skill categories' },
  { value: '48', label: 'Open requests' },
  { value: '92%', label: 'Profile readiness' },
];

const HeroSection = () => {
  const featuredSkill = SKILL_LISTINGS[0];

  return (
    <section className="border-b border-concrete-200 bg-white pt-28" aria-labelledby="hero-headline">
      <div className="container-xl grid gap-10 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">
        <div>
          <span className="eyebrow mb-4">Member Skill Exchange</span>
          <h1 id="hero-headline" className="max-w-3xl text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl">
            A clean boilerplate for members to trade skills and start collaborations.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-steel-600">
            TradeLink gives the team a shared frontend foundation for member profiles, skill listings,
            collaboration requests, messaging, reviews, and dashboard work.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link id="hero-cta-register" to={ROUTES.REGISTER} className="btn-primary">
              Create Member Account
            </Link>
            <Link id="hero-cta-browse" to={ROUTES.BROWSE} className="btn-ghost">
              Browse Skills
            </Link>
          </div>

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
            <p className="text-sm font-semibold text-slate-950">Directory Snapshot</p>
            <p className="mt-1 text-sm text-steel-600">Static sample state for future feature integration.</p>
          </div>
          <div className="space-y-5 p-5">
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-steel-600">Featured skill</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-950">{featuredSkill.title}</h2>
                </div>
                <span className="badge bg-accent-50 text-accent-800 border border-accent-100">{featuredSkill.availability}</span>
              </div>
              <p className="mt-2 text-sm text-steel-600">{featuredSkill.location} · {featuredSkill.member}</p>
            </div>

            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-medium text-steel-700">Profile match</span>
                <span className="font-semibold text-navy-900">{featuredSkill.match}%</span>
              </div>
              <div className="h-2 rounded bg-concrete-100">
                <div className="h-2 rounded bg-navy-800" style={{ width: `${featuredSkill.match}%` }} />
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-3">
              <div className="rounded-md border border-concrete-200 bg-white p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-steel-600">Rate</dt>
                <dd className="mt-1 text-lg font-semibold text-slate-950">{featuredSkill.rate}</dd>
              </div>
              <div className="rounded-md border border-concrete-200 bg-white p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-steel-600">Requests</dt>
                <dd className="mt-1 text-lg font-semibold text-slate-950">8</dd>
              </div>
              <div className="rounded-md border border-concrete-200 bg-white p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-steel-600">Reviews</dt>
                <dd className="mt-1 text-lg font-semibold text-slate-950">14</dd>
              </div>
              <div className="rounded-md border border-concrete-200 bg-white p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-steel-600">Response</dt>
                <dd className="mt-1 text-lg font-semibold text-slate-950">1 day</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
