/**
 * pages/BrowseSkills/index.jsx — Category Browsing with Live Price Filtering
 *
 * Users can browse every skill category and see its current live credit
 * value while searching, then filter/sort listings by category, live price,
 * or availability. Posting a skill adds it to the same pool this page reads
 * from, so it shows up immediately — including skills that don't fit any
 * fixed category, via "Other".
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

const CATEGORY_BY_ID = SKILL_CATEGORIES.reduce((map, cat) => {
  map[cat.id] = cat;
  return map;
}, {});

const AVAILABILITY_BADGE_COLOR = {
  available: 'green',
  limited: 'yellow',
  booked: 'accent',
};

// Tailwind color classes per category theme — keeps every shade in one place.
const THEME_CLASSES = {
  navy: { chip: 'bg-navy-100 text-navy-800', bar: 'bg-navy-500', ring: 'ring-navy-800 border-navy-800' },
  accent: { chip: 'bg-accent-100 text-accent-800', bar: 'bg-accent-500', ring: 'ring-accent-700 border-accent-700' },
  emerald: { chip: 'bg-emerald-100 text-emerald-800', bar: 'bg-emerald-500', ring: 'ring-emerald-700 border-emerald-700' },
  amber: { chip: 'bg-amber-100 text-amber-800', bar: 'bg-amber-500', ring: 'ring-amber-700 border-amber-700' },
  steel: { chip: 'bg-steel-100 text-steel-800', bar: 'bg-steel-500', ring: 'ring-steel-700 border-steel-700' },
  violet: { chip: 'bg-violet-100 text-violet-800', bar: 'bg-violet-500', ring: 'ring-violet-700 border-violet-700' },
  concrete: { chip: 'bg-concrete-100 text-concrete-800', bar: 'bg-concrete-500', ring: 'ring-concrete-700 border-concrete-700' },
};

// Small hand-drawn line icons — no icon library dependency required.
const ICONS = {
  code: (
    <path d="M8 16l-4-4 4-4M16 8l4 4-4 4M13 5l-2 14" strokeLinecap="round" strokeLinejoin="round" />
  ),
  palette: (
    <path
      d="M12 3a9 9 0 100 18c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.4-.3-.3-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.3A4.2 4.2 0 0021 10.5C21 6.4 16.9 3 12 3z M7.5 12a1 1 0 100-2 1 1 0 000 2zM10 8.5a1 1 0 100-2 1 1 0 000 2zM14.5 8a1 1 0 100-2 1 1 0 000 2z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  pen: (
    <path
      d="M4 20l4-1 11-11-3-3L5 16l-1 4zM14 6l3 3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  megaphone: (
    <path
      d="M3 10v4a1 1 0 001 1h2l9 4V5L6 9H4a1 1 0 00-1 1zM15 8a3 3 0 010 8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  chart: (
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" strokeLinecap="round" strokeLinejoin="round" />
  ),
  briefcase: (
    <path
      d="M3 8h18v11a1 1 0 01-1 1H4a1 1 0 01-1-1V8zM8 8V6a2 2 0 012-2h4a2 2 0 012 2v2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  sparkles: (
    <path
      d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
};

const CategoryIcon = ({ icon, className = 'h-5 w-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
    {ICONS[icon] || ICONS.sparkles}
  </svg>
);

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 text-concrete-500">
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
  </svg>
);

/** Small ▲ / ▼ / — indicator next to a category's live value. */
const TrendBadge = ({ multiplier }) => {
  if (multiplier > 1) {
    return <span className="text-xs font-semibold text-emerald-700">▲ high demand</span>;
  }
  if (multiplier < 1) {
    return <span className="text-xs font-semibold text-steel-500">▼ oversupplied</span>;
  }
  return <span className="text-xs font-semibold text-concrete-500">— steady</span>;
};

const EMPTY_FORM = {
  skill: '',
  category: SKILL_CATEGORIES[0]?.id ?? '',
  categoryLabel: '',
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

    if (!form.skill.trim() || !form.providerName.trim() || !form.baseRate) {
      setFormError('Skill, base rate, and your name are required.');
      return;
    }
    if (form.category === 'other' && !form.categoryLabel.trim()) {
      setFormError('Please name the category for this "Other" skill (e.g. Music Lessons).');
      return;
    }

    setIsSubmitting(true);
    try {
      await createSkill({
        title: form.skill.trim(),
        description: form.description.trim(),
        category: form.category,
        categoryLabel: form.category === 'other' ? form.categoryLabel.trim() : undefined,
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
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SKILL_CATEGORIES.map(cat => {
            const stats = categoryValueById[cat.id];
            const isActive = category === cat.id;
            const theme = THEME_CLASSES[cat.theme] || THEME_CLASSES.concrete;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryChip(cat.id)}
                className={`group relative overflow-hidden rounded-xl border bg-white p-4 text-left shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg ${
                  isActive ? `${theme.ring} ring-2` : 'border-concrete-200'
                }`}
              >
                <span className={`absolute inset-y-0 left-0 w-1 ${theme.bar}`} aria-hidden="true" />
                <div className="flex items-start justify-between gap-2 pl-1.5">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${theme.chip}`}>
                    <CategoryIcon icon={cat.icon} />
                  </div>
                  <span className="rounded-md bg-slate-950 px-2 py-1 text-xs font-bold text-white">
                    {stats ? formatCredits(stats.liveValue) : '—'}
                  </span>
                </div>
                <p className="mt-3 pl-1.5 text-sm font-semibold text-slate-950">{cat.label}</p>
                <div className="mt-1 flex items-center justify-between pl-1.5">
                  <p className="text-xs text-steel-600">
                    {stats ? `${stats.supply} active listing${stats.supply === 1 ? '' : 's'}` : 'No listings yet'}
                  </p>
                  {stats && stats.supply > 0 && <TrendBadge multiplier={stats.multiplier} />}
                </div>
              </button>
            );
          })}
        </div>

        {/* ─── Filter bar ───────────────────────────────────────────────── */}
        <div className="surface-card mb-4 grid gap-3 p-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2">
              <SearchIcon />
            </span>
            <input
              id="browse-search"
              type="search"
              placeholder="Search by skill, member, location, or tag"
              className="input-base pl-9"
              value={search}
              onChange={event => setSearch(event.target.value)}
            />
          </div>
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
              className={`badge border transition-colors ${category === '' ? 'bg-navy-50 text-navy-900 border-navy-100' : 'bg-white text-steel-700 border-concrete-200 hover:bg-concrete-50'}`}
              onClick={() => handleCategoryChip('')}
            >
              All
            </button>
            {SKILL_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                id={`category-chip-${cat.id}`}
                className={`badge border transition-colors ${category === cat.id ? 'bg-navy-50 text-navy-900 border-navy-100' : 'bg-white text-steel-700 border-concrete-200 hover:bg-concrete-50'}`}
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
          <Card className="mb-8 overflow-hidden p-0">
            <div className="flex items-center gap-3 border-b border-concrete-200 bg-concrete-50 px-5 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-800 text-white">
                <CategoryIcon icon="sparkles" className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-950">Post a new skill</h2>
                <p className="text-xs text-steel-600">It appears in Browse — and shifts that category's live value — right away.</p>
              </div>
            </div>

            <form onSubmit={handleCreateSkill} className="grid gap-3 p-5 sm:grid-cols-2">
              <input
                name="skill"
                placeholder="Skill (e.g. React Frontend Support, Harmonium Lessons)"
                className="input-base sm:col-span-2"
                value={form.skill}
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

              {form.category === 'other' && (
                <input
                  name="categoryLabel"
                  placeholder='Name this category (e.g. "Music Lessons")'
                  className="input-base sm:col-span-2"
                  value={form.categoryLabel}
                  onChange={handleFormChange}
                />
              )}

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

        {/* ─── Listings ──────────────────────────────────────────────────── */}
        {!isLoading && listings.length === 0 ? (
          <Card className="p-10 text-center">
            <p className="text-sm text-steel-600">
              No listings match these filters yet. Try clearing a filter, or post the first listing in this category.
            </p>
          </Card>
        ) : (
          <div className="grid gap-3">
            {listings.map(listing => {
              const cat = CATEGORY_BY_ID[listing.category];
              const theme = THEME_CLASSES[cat?.theme] || THEME_CLASSES.concrete;
              const categoryDisplay =
                listing.category === 'other' && listing.categoryLabel ? listing.categoryLabel : cat?.label || listing.category;

              return (
                <article
                  key={listing._id}
                  id={`skill-card-${listing._id}`}
                  className="group flex flex-col gap-4 rounded-xl border border-concrete-200 bg-white p-5 shadow-card transition-shadow duration-150 hover:shadow-lg md:flex-row md:items-center"
                >
                  <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg ${theme.chip}`}>
                    <CategoryIcon icon={cat?.icon || 'sparkles'} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge color="gray">{categoryDisplay}</Badge>
                      <Badge color={AVAILABILITY_BADGE_COLOR[listing.availability] || 'gray'}>
                        {listing.availability}
                      </Badge>
                    </div>
                    <h2 className="mt-2 text-base font-semibold text-slate-950">{listing.title}</h2>
                    {listing.tags?.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        {listing.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-xs text-steel-600">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 md:w-44">
                    <Avatar initials={listing.provider?.initials || '?'} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{listing.provider?.name}</p>
                      <p className="truncate text-xs text-steel-500">{listing.location}</p>
                    </div>
                  </div>

                  <div className="text-right md:w-32">
                    <p className="text-base font-bold text-slate-950">{formatCredits(listing.liveValue)}</p>
                    {listing.categoryMultiplier !== 1 && (
                      <p className="text-xs text-steel-500">base {formatCredits(listing.baseRate)}</p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

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