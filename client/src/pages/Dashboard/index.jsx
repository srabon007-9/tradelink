/**
 * pages/Dashboard/index.jsx — Member dashboard overview scaffold.
 */

import { SKILL_LISTINGS } from '../../constants';
import Badge from '../../components/ui/Badge';

const STAT_CARDS = [
  { label: 'Listed Skills', value: SKILL_LISTINGS.length, detail: 'Sample data for directory wiring' },
  { label: 'Open Requests', value: 12, detail: 'Placeholder request queue' },
  { label: 'Unread Messages', value: 5, detail: 'Ready for messaging module' },
  { label: 'Reviews', value: 18, detail: 'Ready for review module' },
];

const Dashboard = () => (
  <div className="space-y-6">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <span className="eyebrow mb-2">Member Dashboard</span>
        <h1 className="text-3xl font-semibold text-slate-950">Workspace overview</h1>
        <p className="mt-2 text-sm text-steel-600">
          A compact placeholder for profile, skills, requests, messages, reviews, and account settings.
        </p>
      </div>
      <Badge color="green">Scaffold ready</Badge>
    </div>

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {STAT_CARDS.map(stat => (
        <article key={stat.label} className="surface-card p-5">
          <p className="text-sm font-medium text-steel-600">{stat.label}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{stat.value}</p>
          <p className="mt-2 text-xs text-steel-600">{stat.detail}</p>
        </article>
      ))}
    </div>

    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_0.8fr]">
      <section className="surface-card overflow-hidden">
        <div className="border-b border-concrete-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-950">Skill Listings</h2>
          <p className="mt-1 text-sm text-steel-600">Sample records future profile and listing features can replace with API data.</p>
        </div>
        <div className="divide-y divide-concrete-200">
          {SKILL_LISTINGS.slice(0, 5).map(listing => (
            <div key={listing.id} className="grid gap-4 px-5 py-4 md:grid-cols-[1fr_120px_120px] md:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-slate-950">{listing.title}</h3>
                  <Badge color={listing.availability === 'Available' ? 'green' : listing.availability === 'Limited' ? 'yellow' : 'accent'}>
                    {listing.availability}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-steel-600">{listing.member} · {listing.location}</p>
              </div>
              <span className="text-sm font-semibold text-slate-950">{listing.rate}</span>
              <div>
                <div className="mb-1 flex justify-between text-xs text-steel-600">
                  <span>Match</span>
                  <span>{listing.match}%</span>
                </div>
                <div className="h-2 rounded bg-concrete-100">
                  <div className="h-2 rounded bg-navy-800" style={{ width: `${listing.match}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="surface-card p-5">
        <h2 className="text-base font-semibold text-slate-950">Pending Feature Areas</h2>
        <div className="mt-4 space-y-3">
          {[
            ['Profiles', 'Add profile editing, avatar upload, portfolio links, and availability updates.'],
            ['Requests', 'Implement collaboration requests, proposal states, and assignment ownership.'],
            ['Messages', 'Connect member-to-member messaging and unread state indicators.'],
            ['Reviews', 'Add completed work reviews, ratings, and moderation rules.'],
          ].map(([label, text]) => (
            <div key={text} className="rounded-md border border-concrete-200 bg-concrete-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-accent-700">{label}</p>
              <p className="mt-2 text-sm leading-6 text-steel-700">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  </div>
);

export default Dashboard;
