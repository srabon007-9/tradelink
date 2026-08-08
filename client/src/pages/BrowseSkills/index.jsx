/**
 * pages/BrowseSkills/index.jsx — Member directory fetched from the database.
 */

import { useEffect, useState } from 'react';
import { SKILL_CATEGORIES } from '../../constants';
import PageHeader from '../../components/layout/PageHeader';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import api from '../../services/api';

const BrowseSkills = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    api.get('/users')
      .then(res => setMembers(res.data?.data || []))
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = members.filter(user => {
    const q = search.toLowerCase();
    const matchesQuery =
      user.name?.toLowerCase().includes(q) ||
      user.email?.toLowerCase().includes(q) ||
      user.company?.toLowerCase().includes(q) ||
      user.bio?.toLowerCase().includes(q);

    const matchesCategory = !category || [user.name, user.email, user.company, user.bio]
      .some(value => value?.toLowerCase().includes(category.toLowerCase()));

    return matchesQuery && matchesCategory;
  });

  return (
    <div>
      <PageHeader
        eyebrow="Member Directory"
        title="Browse members"
        subtitle="Real registered members on the platform."
      />

      <div className="container-xl py-12">
        <div className="surface-card mb-8 grid gap-3 p-4 lg:grid-cols-[1fr_220px]">
          <input
            id="browse-search"
            type="search"
            placeholder="Search by name, email, or company"
            className="input-base"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            id="browse-category-filter"
            className="input-base cursor-pointer"
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            <option value="">All categories</option>
            {SKILL_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="mb-5 flex items-center justify-between">
          <p className="text-sm text-steel-600">
            {loading ? 'Loading…' : (
              <>Showing <span className="font-semibold text-slate-950">{filtered.length}</span> member{filtered.length !== 1 ? 's' : ''}</>
            )}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16 text-sm text-steel-600">Loading members…</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-concrete-200 bg-concrete-50 py-16 text-center">
            <p className="text-base font-semibold text-slate-950">
              {search || category ? 'No members match your search' : 'No members yet'}
            </p>
            <p className="mt-2 text-sm text-steel-600">
              {search || category ? 'Try a different search term.' : 'Registered members will appear here.'}
            </p>
          </div>
        ) : (
          <div className="table-shell">
            <div className="hidden grid-cols-[1.5fr_1fr_1fr_1fr] gap-4 border-b border-concrete-200 bg-concrete-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-steel-600 md:grid">
              <span>Member</span>
              <span>Email</span>
              <span>Role</span>
              <span>Company</span>
            </div>

            <div className="divide-y divide-concrete-200">
              {filtered.map(user => {
                const initials = user.name
                  ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                  : '??';
                return (
                  <article key={user._id} id={`member-card-${user._id}`} className="grid gap-4 px-5 py-5 md:grid-cols-[1.5fr_1fr_1fr_1fr] md:items-center">
                    <div className="flex items-center gap-3">
                      <Avatar initials={initials} size="sm" />
                      <span className="text-sm font-semibold text-slate-950">{user.name}</span>
                    </div>
                    <span className="text-sm text-steel-700">{user.email}</span>
                    <Badge color="gray">{user.role || 'client'}</Badge>
                    <span className="text-sm text-steel-700">{user.company || '—'}</span>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowseSkills;
