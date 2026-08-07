/**
 * pages/Dashboard/index.jsx — Member dashboard overview.
 */

import { useEffect, useState, useContext } from 'react';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import AuthContext from '../../context/AuthContext';
import api from '../../services/api';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users')
      .then(res => setMembers(res.data.data))
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, []);

  const STAT_CARDS = [
    { label: 'Total Members', value: loading ? '…' : members.length, detail: 'Registered on the platform' },
    { label: 'Open Requests', value: 0, detail: 'Coming soon' },
    { label: 'Active Trades', value: 0, detail: 'Coming soon' },
    { label: 'Reviews', value: 0, detail: 'Coming soon' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="eyebrow mb-2">Member Dashboard</span>
          <h1 className="text-3xl font-semibold text-slate-950">
            Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
          </h1>
          <p className="mt-2 text-sm text-steel-600">
            Your workspace overview on TradeLink.
          </p>
        </div>
        <Badge color="green">Live</Badge>
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
            <h2 className="text-base font-semibold text-slate-950">Registered Members</h2>
            <p className="mt-1 text-sm text-steel-600">All members currently on the platform.</p>
          </div>
          <div className="divide-y divide-concrete-200">
            {loading ? (
              <p className="px-5 py-6 text-sm text-steel-600">Loading…</p>
            ) : members.length === 0 ? (
              <p className="px-5 py-6 text-sm text-steel-600">No members yet.</p>
            ) : (
              members.slice(0, 8).map(u => {
                const initials = u.name
                  ? u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                  : '??';
                return (
                  <div key={u._id} className="grid gap-4 px-5 py-4 md:grid-cols-[1fr_140px_100px] md:items-center">
                    <div className="flex items-center gap-3">
                      <Avatar initials={initials} size="sm" />
                      <div>
                        <p className="font-semibold text-slate-950">{u.name}</p>
                        <p className="text-xs text-steel-600">{u.email}</p>
                      </div>
                    </div>
                    <span className="text-sm text-steel-700">{u.company || '—'}</span>
                    <Badge color="gray">{u.role || 'client'}</Badge>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="surface-card p-5">
          <h2 className="text-base font-semibold text-slate-950">Upcoming Features</h2>
          <div className="mt-4 space-y-3">
            {[
              ['Dynamic Pricing', 'Credit values that float based on live supply and demand.'],
              ['Credit Wallet', 'Earn and spend credits by completing trades.'],
              ['Trade Proposals', 'Build and accept skill-swap deals with live pricing.'],
              ['Escrow', 'Credits held safely until both parties confirm completion.'],
            ].map(([label, text]) => (
              <div key={label} className="rounded-md border border-concrete-200 bg-concrete-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-accent-700">{label}</p>
                <p className="mt-2 text-sm leading-6 text-steel-700">{text}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
