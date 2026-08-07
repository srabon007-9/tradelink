/**
 * pages/BrowseSkills/index.jsx — Category Browsing with Live Price Filtering
 *
 * Users can browse every skill category and see its current live credit
 * value while searching, then filter/sort listings by category, live price,
 * or availability. Posting a skill (via the form here, or eventually a full
 * profile page) adds it to the same pool this page reads from, so it shows
 * up immediately.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';

import { AVAILABILITY_OPTIONS, BROWSE_SORT_OPTIONS, SKILL_CATEGORIES } from '../../constants';
import { createSkill, getSkills } from '../../services/skillService';
import { formatCredits } from '../../utils/formatters';
import PageHeader from '../../components/layout/PageHeader';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const CATEGORY_LABELS = SKILL_CATEGORIES.reduce((map, cat) => {
  map[cat.id] = cat.label;
  return map;
}, {});

const AVAILABILITY_BADGE_COLOR = {
  available: 'green',
  limited: 'yellow',
  booked: 'accent',
};

const EMPTY_FORM = {
  title: '',
  category: SKILL_CATEGORIES[0]?.id ?? '',
  baseRate: '',
  availability: 'available',
  location: '',
  tags: '',
  providerName: '',
  description: '',
};

const BrowseSkills = () => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('');
  const [availability, setAvailability] = useState('');
  const [sort, setSort] = useState('match');
  const [page, setPage] = useState(1);

  const [listings, setListings] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debounce free-text search so we don't hit the API on every keystroke.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timeout);
  }, [search]);

  const fetchListings = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const { items, categories, pagination: nextPagination } = await getSkills({
        search: debouncedSearch,
        category,
        availability,
        sort,
        page,
        limit: 10,
      });
      setListings(items);
      setCategoryStats(categories);
      setPagination(nextPagination);
    } catch {
      setError('Could not load skill listings right now. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, category, availability, sort, page]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Live credit value per category, keyed by id — used on the chips/cards
  // and stays visible even while a category filter narrows the list below.
  const categoryValueById = useMemo(
    () => categoryStats.reduce((map, stat) => {
      map[stat.id] = stat;
      return map;
    }, {}),
    [categoryStats]
  );

  const handleCategoryChip = id => {
    setCategory(prev => (prev === id ? '' : id));
    setPage(1);
  };

  const handleFilterChange = (setter) => event => {
    setter(event.target.value);
    setPage(1);
  };

  const handleFormChange = event => {
    const { name, value } = event.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateSkill = async event => {
    event.preventDefault();
    setFormError('');

    if (!form.title.trim() || !form.providerName.trim() || !form.baseRate) {
      setFormError('Title, base rate, and your name are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createSkill({
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        baseRate: Number(form.baseRate),
        availability: form.availability,
        location: form.location.trim() || 'Remote',
        tags: form.tags
          .split(',')
          .map(tag => tag.trim())
          .filter(Boolean),
        providerName: form.providerName.trim(),
      });

      setForm(EMPTY_FORM);
      setShowForm(false);
      setPage(1);
      await fetchListings();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Could not post this skill. Please check the fields and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeFilterCount = [category, availability, debouncedSearch].filter(Boolean).length;

  return (
    <div>
      <PageHeader
        eyebrow="Skill Directory"
        title="Browse skill categories"
        subtitle="See each category's current live credit value, then filter and sort listings by category, live price, or availability to find the best trade opportunity right now."
      />

      <div className="container-xl py-12">
        {/* ─── Category live-value cards ───────────────────────────────── */}
        <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SKILL_CATEGORIES.map(cat => {
            const stats = categoryValueById[cat.id];
            const isActive = category === cat.id;
            return (
              <Card
                key={cat.id}
                hover
                onClick={() => handleCategoryChip(cat.id)}
                className={isActive ? 'border-navy-800 ring-1 ring-navy-800' : ''}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{cat.label}</p>
                    <p className="mt-1 text-xs text-steel-600">
                      {stats ? `${stats.supply} active listing${stats.supply === 1 ? '' : 's'}` : 'No active listings yet'}
                    </p>
                  </div>
                  <Badge color={isActive ? 'primary' : 'gray'}>
                    {stats ? formatCredits(stats.liveValue) : '—'}
                  </Badge>
                </div>
              </Card>
            );
          })}
        </div>

        {/* ─── Filter bar ───────────────────────────────────────────────── */}
        <div className="surface-card mb-4 grid gap-3 p-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <input
            id="browse-search"
            type="search"
            placeholder="Search by skill, member, location, or tag"
            className="input-base"
            value={search}
            onChange={event => setSearch(event.target.value)}
          />
          <select
            id="browse-category-filter"
            className="input-base cursor-pointer"
            value={category}
            onChange={handleFilterChange(setCategory)}
          >
            <option value="">All categories</option>
            {SKILL_CATEGORIES.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
          </select>
          <select
            id="browse-availability-filter"
            className="input-base cursor-pointer"
            value={availability}
            onChange={handleFilterChange(setAvailability)}
          >
            <option value="">Any availability</option>
            {AVAILABILITY_OPTIONS.map(opt => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
          <select
            id="browse-sort-filter"
            className="input-base cursor-pointer"
            value={sort}
            onChange={handleFilterChange(setSort)}
          >
            {BROWSE_SORT_OPTIONS.map(opt => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2" role="list" aria-label="Skill category filters">
            <button
              className={`badge border ${category === '' ? 'bg-navy-50 text-navy-900 border-navy-100' : 'bg-white text-steel-700 border-concrete-200 hover:bg-concrete-50'}`}
              onClick={() => handleCategoryChip('')}
            >
              All
            </button>
            {SKILL_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                id={`category-chip-${cat.id}`}
                className={`badge border ${category === cat.id ? 'bg-navy-50 text-navy-900 border-navy-100' : 'bg-white text-steel-700 border-concrete-200 hover:bg-concrete-50'}`}
                onClick={() => handleCategoryChip(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <Button size="sm" variant={showForm ? 'outline' : 'primary'} onClick={() => setShowForm(prev => !prev)}>
            {showForm ? 'Cancel' : '+ Post a skill'}
          </Button>
        </div>

        {/* ─── Post-a-skill quick form ──────────────────────────────────── */}
        {showForm && (
          <Card className="mb-8 p-5">
            <h2 className="mb-4 text-base font-semibold text-slate-950">Post a new skill listing</h2>
            <form onSubmit={handleCreateSkill} className="grid gap-3 sm:grid-cols-2">
              <input
                name="title"
                placeholder="Skill title (e.g. React Frontend Support)"
                className="input-base sm:col-span-2"
                value={form.title}
                onChange={handleFormChange}
              />
              <select name="category" className="input-base cursor-pointer" value={form.category} onChange={handleFormChange}>
                {SKILL_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
              <input
                name="baseRate"
                type="number"
                min="0"
                placeholder="Base rate (credits)"
                className="input-base"
                value={form.baseRate}
                onChange={handleFormChange}
              />
              <select name="availability" className="input-base cursor-pointer" value={form.availability} onChange={handleFormChange}>
                {AVAILABILITY_OPTIONS.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
              <input
                name="location"
                placeholder="Location (e.g. Dhaka, Remote)"
                className="input-base"
                value={form.location}
                onChange={handleFormChange}
              />
              <input
                name="tags"
                placeholder="Tags, comma-separated (e.g. React, API Integration)"
                className="input-base sm:col-span-2"
                value={form.tags}
                onChange={handleFormChange}
              />
              <input
                name="providerName"
                placeholder="Your name"
                className="input-base"
                value={form.providerName}
                onChange={handleFormChange}
              />
              <textarea
                name="description"
                placeholder="Short description (optional)"
                className="input-base sm:col-span-2"
                rows={2}
                value={form.description}
                onChange={handleFormChange}
              />
              {formError && <p className="text-sm text-red-700 sm:col-span-2">{formError}</p>}
              <div className="sm:col-span-2">
                <Button type="submit" isLoading={isSubmitting}>Post listing</Button>
              </div>
            </form>
          </Card>
        )}

        {/* ─── Results summary ──────────────────────────────────────────── */}
        <div className="mb-5 flex items-center justify-between">
          <p className="text-sm text-steel-600">
            {isLoading ? (
              'Loading listings…'
            ) : (
              <>
                Showing <span className="font-semibold text-slate-950">{listings.length}</span> of{' '}
                <span className="font-semibold text-slate-950">{pagination.total}</span> live listing
                {pagination.total === 1 ? '' : 's'}
                {activeFilterCount > 0 && ' matching your filters'}
              </>
            )}
          </p>
        </div>

        {error && <p className="mb-4 text-sm text-red-700">{error}</p>}

        {/* ─── Listings table ────────────────────────────────────────────── */}
        <div className="table-shell">
          <div className="hidden grid-cols-[1.5fr_1fr_1fr_0.8fr] gap-4 border-b border-concrete-200 bg-concrete-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-steel-600 md:grid">
            <span>Skill</span>
            <span>Member</span>
            <span>Location</span>
            <span>Live Value</span>
          </div>

          <div className="divide-y divide-concrete-200">
            {!isLoading && listings.length === 0 && (
              <p className="px-5 py-10 text-center text-sm text-steel-600">
                No listings match these filters yet. Try clearing a filter, or post the first listing in this category.
              </p>
            )}

            {listings.map(listing => (
              <article
                key={listing._id}
                id={`skill-card-${listing._id}`}
                className="grid gap-4 px-5 py-5 md:grid-cols-[1.5fr_1fr_1fr_0.8fr] md:items-center"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Badge color="gray">{CATEGORY_LABELS[listing.category] || listing.category}</Badge>
                    <Badge color={AVAILABILITY_BADGE_COLOR[listing.availability] || 'gray'}>
                      {listing.availability}
                    </Badge>
                  </div>
                  <h2 className="mt-3 text-base font-semibold text-slate-950">{listing.title}</h2>
                  {listing.tags?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {listing.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-xs text-steel-600">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Avatar initials={listing.provider?.initials || '?'} size="sm" />
                  <span className="text-sm font-medium text-slate-900">{listing.provider?.name}</span>
                </div>
                <span className="text-sm text-steel-700">{listing.location}</span>
                <div>
                  <span className="text-sm font-semibold text-slate-950">{formatCredits(listing.liveValue)}</span>
                  {listing.categoryMultiplier !== 1 && (
                    <p className="text-xs text-steel-500">base {formatCredits(listing.baseRate)}</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* ─── Pagination ────────────────────────────────────────────────── */}
        {pagination.pages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-3">
            <Button
              size="sm"
              variant="outline"
              disabled={pagination.page <= 1}
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
            >
              Previous
            </Button>
            <span className="text-sm text-steel-600">
              Page {pagination.page} of {pagination.pages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={pagination.page >= pagination.pages}
              onClick={() => setPage(prev => Math.min(pagination.pages, prev + 1))}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowseSkills;