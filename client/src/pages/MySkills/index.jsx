/**
 * pages/MySkills/index.jsx — Member skill listing dashboard.
 */

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { ROUTES, SKILL_CATEGORIES, SKILL_STATUSES } from '../../constants';
import { skillService } from '../../services/skill.service';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'alphabetical', label: 'Alphabetical' },
  { value: 'baseRate', label: 'Base Rate' },
];

const formatCurrency = value =>
  new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0,
  }).format(value || 0);

const formatDate = value =>
  value
    ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
    : 'Not available';

const statusColor = status => {
  if (status === 'active') {
    return 'green';
  }
  if (status === 'paused') {
    return 'yellow';
  }
  return 'gray';
};

const MySkills = () => {
  const [skills, setSkills] = useState([]);
  const [filters, setFilters] = useState({ search: '', category: '', status: '', sort: 'newest' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState('');

  const query = useMemo(
    () => Object.fromEntries(Object.entries(filters).filter(([, value]) => value)),
    [filters]
  );

  useEffect(() => {
    let isCurrent = true;
    setIsLoading(true);
    setError('');

    skillService
      .listMine(query)
      .then(data => {
        if (isCurrent) {
          setSkills(data);
        }
      })
      .catch(apiError => {
        if (isCurrent) {
          setError(apiError.response?.data?.message || 'Unable to load skill listings.');
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [query]);

  const updateFilter = event => {
    const { name, value } = event.target;
    setFilters(current => ({ ...current, [name]: value }));
  };

  const updateStatus = async (skill, status) => {
    setBusyId(skill._id);
    setNotice('');
    try {
      const updatedSkill = await skillService.updateStatus(skill._id, status);
      setSkills(current => current.map(item => (item._id === updatedSkill._id ? updatedSkill : item)));
      setNotice(`"${updatedSkill.title}" is now ${updatedSkill.status}.`);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Unable to update listing status.');
    } finally {
      setBusyId('');
    }
  };

  const deleteSkill = async skill => {
    const confirmed = window.confirm(`Delete "${skill.title}"? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setBusyId(skill._id);
    setNotice('');
    try {
      await skillService.remove(skill._id);
      setSkills(current => current.filter(item => item._id !== skill._id));
      setNotice(`"${skill.title}" was deleted.`);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Unable to delete skill listing.');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <span className="eyebrow mb-2">Skill Listings</span>
          <h1 className="text-3xl font-semibold text-slate-950">My Skills</h1>
          <p className="mt-2 max-w-2xl text-sm text-steel-600">
            Manage service listings, availability, and pricing inputs for future valuation workflows.
          </p>
        </div>
        <Link to={`${ROUTES.MY_SKILLS}/new`} className="btn-primary">
          Create Skill
        </Link>
      </div>

      {notice && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {notice}
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {error}
        </div>
      )}

      <section className="surface-card grid gap-3 p-4 lg:grid-cols-[1fr_220px_180px_180px]">
        <input name="search" value={filters.search} onChange={updateFilter} type="search" placeholder="Search listings" className="input-base" />
        <select name="category" value={filters.category} onChange={updateFilter} className="input-base cursor-pointer">
          <option value="">All categories</option>
          {SKILL_CATEGORIES.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
        <select name="status" value={filters.status} onChange={updateFilter} className="input-base cursor-pointer">
          <option value="">All statuses</option>
          {SKILL_STATUSES.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
        <select name="sort" value={filters.sort} onChange={updateFilter} className="input-base cursor-pointer">
          {SORT_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </section>

      <section className="table-shell">
        <div className="hidden grid-cols-[1.4fr_1fr_0.8fr_0.8fr_0.8fr_1.2fr] gap-4 border-b border-concrete-200 bg-concrete-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-steel-600 xl:grid">
          <span>Skill</span>
          <span>Category</span>
          <span>Base Rate</span>
          <span>Experience</span>
          <span>Status</span>
          <span>Actions</span>
        </div>

        {isLoading ? (
          <div className="px-5 py-12 text-center text-sm font-medium text-steel-600">Loading skill listings...</div>
        ) : skills.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <h2 className="text-lg font-semibold text-slate-950">No skill listings yet</h2>
            <p className="mt-2 text-sm text-steel-600">Create your first listing to start building your TradeLink profile.</p>
            <Link to={`${ROUTES.MY_SKILLS}/new`} className="btn-primary mt-5">
              Create Skill
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-concrete-200">
            {skills.map(skill => (
              <article key={skill._id} className="grid gap-4 px-5 py-5 xl:grid-cols-[1.4fr_1fr_0.8fr_0.8fr_0.8fr_1.2fr] xl:items-center">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-20 flex-shrink-0 overflow-hidden rounded-md border border-concrete-200 bg-concrete-50">
                    {skill.thumbnail ? (
                      <img src={skill.thumbnail} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-steel-600">TL</div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold text-slate-950">{skill.title}</h2>
                    <p className="mt-1 text-xs text-steel-600">Created {formatDate(skill.createdAt)}</p>
                  </div>
                </div>
                <span className="text-sm text-steel-700">{skill.category}</span>
                <span className="text-sm font-semibold text-slate-950">{formatCurrency(skill.baseRate)}</span>
                <span className="text-sm text-steel-700">{skill.experienceLevel}</span>
                <Badge color={statusColor(skill.status)}>{skill.status}</Badge>
                <div className="flex flex-wrap gap-2">
                  <Link to={`${ROUTES.MY_SKILLS}/${skill._id}`} className="btn-ghost px-3 py-2 text-xs">View</Link>
                  <Link to={`${ROUTES.MY_SKILLS}/${skill._id}/edit`} className="btn-ghost px-3 py-2 text-xs">Edit</Link>
                  {skill.status === 'active' ? (
                    <Button type="button" size="sm" variant="outline" isLoading={busyId === skill._id} onClick={() => updateStatus(skill, 'paused')}>Pause</Button>
                  ) : (
                    <Button type="button" size="sm" variant="outline" isLoading={busyId === skill._id} onClick={() => updateStatus(skill, 'active')}>Resume</Button>
                  )}
                  <Button type="button" size="sm" variant="danger" isLoading={busyId === skill._id} onClick={() => deleteSkill(skill)}>Delete</Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default MySkills;
