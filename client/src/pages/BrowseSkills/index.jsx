/**
 * pages/BrowseSkills/index.jsx — Category Browsing With Live Price Filtering
 *
 * Browse all skill categories with their current live price (from the
 * Dynamic Valuation Engine), and filter/sort the active skill listings
 * (see Skill Listing Profiles) by category, live price, or search text.
 */

import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import PageHeader from '../../components/layout/PageHeader';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { cn } from '../../utils/cn';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { ROUTES } from '../../constants';
import { formatCredits, truncate } from '../../utils/formatters';

const toLocalInputValue = date => {
  const pad = n => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const MIN_SESSION_DATETIME = toLocalInputValue(new Date(Date.now() + 30 * 60 * 1000));

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

const initialsOf = name =>
  name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '??';

const CategoryChip = ({ active, label, price, count, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'flex flex-shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors duration-150',
      active
        ? 'border-navy-800 bg-navy-800 text-white'
        : 'border-concrete-200 bg-white text-steel-700 hover:border-concrete-300'
    )}
  >
    {label}
    {price != null && (
      <span className={cn('text-xs font-bold', active ? 'text-accent-200' : 'text-accent-700')}>
        {formatCredits(price)}
      </span>
    )}
    <span className={cn('text-xs', active ? 'text-navy-100' : 'text-steel-400')}>({count})</span>
  </button>
);

const BrowseSkills = () => {
  const { isLoggedIn, user } = useAuth();
  const { addToast } = useToast();
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard');

  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState('newest');

  const [listings, setListings] = useState([]);
  const [totalListings, setTotalListings] = useState(0);
  const [loading, setLoading] = useState(true);

  const [bookingOpenId, setBookingOpenId] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingMessage, setBookingMessage] = useState('');
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookedIds, setBookedIds] = useState(new Set());

  useEffect(() => {
    api.get('/valuations')
      .then(res => setCategories(res.data.data))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (searchQuery) params.append('q', searchQuery);
    if (sort) params.append('sort', sort);

    api.get(`/browse?${params.toString()}`)
      .then(res => {
        setListings(res.data.data.listings);
        setTotalListings(res.data.data.totalListings);
      })
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }, [category, searchQuery, sort]);

  const openBooking = listingId => {
    setBookingOpenId(listingId);
    setBookingDate(MIN_SESSION_DATETIME);
    setBookingMessage('');
    setBookingError('');
  };

  const closeBooking = () => {
    setBookingOpenId(null);
    setBookingError('');
  };

  const submitBooking = async listingId => {
    setBookingError('');
    if (!bookingDate) {
      setBookingError('Please choose a session date and time.');
      return;
    }

    setBookingSubmitting(true);
    try {
      await api.post('/trade-proposals', {
        listingId,
        proposedSessionAt: new Date(bookingDate).toISOString(),
        message: bookingMessage.trim() || undefined,
      });
      setBookedIds(prev => new Set(prev).add(listingId));
      setBookingOpenId(null);
      addToast('Trade proposal sent successfully!', 'success');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send the proposal. Please try again.';
      setBookingError(msg);
      addToast(msg, 'error');
    } finally {
      setBookingSubmitting(false);
    }
  };

  const hasActiveFilters = category !== '' || searchInput.trim() !== '';

  const clearFilters = () => {
    setCategory('');
    setSearchInput('');
    setSort('newest');
  };

  const mainContent = (
    <>
      {/* ── Category Chips ────────────────────────────────────────────── */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        <CategoryChip
          active={category === ''}
          label="All Categories"
          price={null}
          count={totalListings}
          onClick={() => setCategory('')}
        />
        {categories.map(cat => (
          <CategoryChip
            key={cat.slug}
            active={category === cat.slug}
            label={cat.name}
            price={cat.priceBDT}
            count={cat.listingCount}
            onClick={() => setCategory(cat.slug)}
          />
        ))}
      </div>

      {/* ── Search + Sort Controls ───────────────────────────────────── */}
      <div className="surface-card mb-8 grid gap-3 p-4 lg:grid-cols-[1fr_220px_auto]">
        <input
          id="browse-search"
          type="search"
          placeholder="Search listings by title or description..."
          className="input-base"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
        />
        <select
          id="browse-sort"
          className="input-base cursor-pointer"
          value={sort}
          onChange={e => setSort(e.target.value)}
        >
          {SORT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>
              Sort: {opt.label}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <Button variant="ghost" onClick={clearFilters} className="text-xs">
            Clear Filters ✕
          </Button>
        )}
      </div>

      <p className="mb-5 text-sm text-steel-600 flex items-center justify-between">
        <span>
          {loading ? 'Searching listings…' : (
            <>Showing <span className="font-semibold text-slate-950">{listings.length}</span> available listing{listings.length !== 1 ? 's' : ''}</>
          )}
        </span>
      </p>

      {/* ── Listings ──────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : listings.length === 0 ? (
        <div className="rounded-lg border border-concrete-200 bg-concrete-50 py-16 text-center">
          <p className="text-base font-semibold text-slate-950">No listings match your filters</p>
          <p className="mt-2 text-sm text-steel-600">Try a different category, search term, or clear your filters.</p>
          {hasActiveFilters && (
            <Button size="sm" variant="outline" className="mt-4" onClick={clearFilters}>
              Reset Search Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {listings.map(listing => {
            const isOwnListing = isLoggedIn && user?.id && String(listing.user?._id) === String(user.id);
            const isPriced = listing.currentPriceBDT != null;
            const isBooked = bookedIds.has(listing._id);
            const isFormOpen = bookingOpenId === listing._id;

            return (
              <article key={listing._id} className="surface-card flex flex-col p-5 relative">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge color="gray">{listing.categoryName}</Badge>
                    {isOwnListing && <Badge color="primary">Your Listing</Badge>}
                  </div>

                  {isPriced ? (
                    <span className="text-lg font-bold text-navy-900">{formatCredits(listing.currentPriceBDT)}</span>
                  ) : (
                    <span className="text-xs font-semibold text-steel-400">Not tracked</span>
                  )}
                </div>

                <h3 className="mt-3 text-base font-semibold text-slate-950">{listing.title}</h3>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-steel-600">
                  {truncate(listing.description, 120)}
                </p>

                <div className="mt-4 flex items-center gap-3 border-t border-concrete-200 pt-4">
                  <Avatar
                    initials={initialsOf(listing.user?.name)}
                    src={listing.user?.avatar || undefined}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-950">
                      {listing.user?.name || 'Unknown provider'}
                    </p>
                    <p className="truncate text-xs text-steel-500">
                      {listing.user?.company || listing.user?.bio || 'TradeLink member'}
                    </p>
                  </div>
                </div>

                {!isLoggedIn ? (
                  <Link
                    to={ROUTES.LOGIN}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md border border-navy-800 px-5 py-2.5 text-sm font-semibold text-navy-800 transition-colors duration-150 hover:bg-navy-50"
                  >
                    Log In to Book
                  </Link>
                ) : isOwnListing ? (
                  <Button size="sm" fullWidth className="mt-4" disabled title="You can't book your own listing">
                    Your Own Listing
                  </Button>
                ) : !isPriced ? (
                  <Button size="sm" fullWidth className="mt-4" disabled title="This skill isn't priced by the valuation engine yet">
                    Not Available Yet
                  </Button>
                ) : isBooked ? (
                  <Button size="sm" fullWidth className="mt-4" disabled>
                    Proposal Sent ✓
                  </Button>
                ) : isFormOpen ? (
                  <div className="mt-4 space-y-3 border-t border-concrete-200 pt-4">
                    <p className="text-xs text-steel-500">
                      Booking locks in today's live rate:{' '}
                      <span className="font-semibold text-navy-900">{formatCredits(listing.currentPriceBDT)}</span>
                    </p>
                    <div>
                      <label htmlFor={`session-time-${listing._id}`} className="mb-1 block text-xs font-medium text-steel-700">
                        Proposed session time
                      </label>
                      <input
                        id={`session-time-${listing._id}`}
                        type="datetime-local"
                        className="input-base"
                        min={MIN_SESSION_DATETIME}
                        value={bookingDate}
                        onChange={e => setBookingDate(e.target.value)}
                      />
                    </div>
                    <textarea
                      rows={2}
                      placeholder="Optional message to the provider"
                      className="input-base"
                      value={bookingMessage}
                      onChange={e => setBookingMessage(e.target.value)}
                      maxLength={500}
                    />
                    {bookingError && <p className="text-xs text-red-600">{bookingError}</p>}
                    <div className="flex gap-2">
                      <Button size="sm" disabled={bookingSubmitting} onClick={() => submitBooking(listing._id)}>
                        {bookingSubmitting ? 'Sending…' : 'Send Proposal'}
                      </Button>
                      <Button size="sm" variant="ghost" disabled={bookingSubmitting} onClick={closeBooking}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button size="sm" fullWidth className="mt-4" onClick={() => openBooking(listing._id)}>
                    Book Session
                  </Button>
                )}
              </article>
            );
          })}
        </div>
      )}
    </>
  );

  if (isDashboard) {
    return (
      <div className="space-y-6">
        <div>
          <span className="eyebrow mb-2">Category Browsing</span>
          <h1 className="text-3xl font-semibold text-slate-950">Browse Skills & Live Prices</h1>
          <p className="mt-2 text-sm text-steel-600">
            Filter active skill listings by category, live Dynamic Valuation price, or keyword.
          </p>
        </div>
        {mainContent}
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Category Browsing"
        title="Browse Skills & Live Prices"
        description="Filter active skill listings by category, live Dynamic Valuation price, or keyword."
      />
      <div className="container-xl pb-16">{mainContent}</div>
    </div>
  );
};

export default BrowseSkills;
