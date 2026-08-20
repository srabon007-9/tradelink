/**
 * pages/Watchlist/index.jsx — Watchlist
 *
 * Watch a skill category with a target price threshold. A separate
 * backend job checks the category's live price every few minutes and
 * emails you the moment your condition is met — no need to keep
 * checking Market Prices manually.
 */

import { useEffect, useState } from 'react';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';

const EMPTY_FORM = { category: '', condition: 'below', thresholdBDT: '' };

const Watchlist = () => {
  const [categories, setCategories] = useState([]);
  const [watches, setWatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [rowError, setRowError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const loadAll = () => {
    setLoading(true);
    Promise.all([api.get('/valuations'), api.get('/watchlist/mine')])
      .then(([catRes, watchRes]) => {
        setCategories(catRes.data.data);
        setWatches(watchRes.data.data);
      })
      .catch(() => {
        setCategories([]);
        setWatches([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleFormChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setFormError('');
  };

  const handleCreateSubmit = async e => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!form.category) {
      setFormError('Please choose a category to watch.');
      return;
    }
    if (form.thresholdBDT === '' || Number(form.thresholdBDT) < 0) {
      setFormError('Target price must be a positive number.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/watchlist', {
        category: form.category,
        condition: form.condition,
        thresholdBDT: Number(form.thresholdBDT),
      });
      setForm(EMPTY_FORM);
      setFormSuccess('Added to your watchlist.');
      loadAll();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to add this watch. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const reactivate = async id => {
    setRowError('');
    setBusyId(id);
    try {
      await api.patch(`/watchlist/${id}/reactivate`);
      loadAll();
    } catch (err) {
      setRowError(err.response?.data?.message || 'Failed to reactivate this watch.');
    } finally {
      setBusyId(null);
    }
  };

  const removeWatch = async (id, label) => {
    if (!window.confirm(`Remove "${label}" from your watchlist?`)) return;

    setRowError('');
    setBusyId(id);
    try {
      await api.delete(`/watchlist/${id}`);
      loadAll();
    } catch (err) {
      setRowError(err.response?.data?.message || 'Failed to remove this watch.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="eyebrow mb-2">Watchlist</span>
        <h1 className="text-3xl font-semibold text-slate-950">Price Watchlist</h1>
        <p className="mt-2 text-sm text-steel-600">
          Watch a skill category and set a target price. We'll email you the moment the live price crosses
          it — checked automatically every few minutes.
        </p>
      </div>

      {/* ── Add Watch Form ───────────────────────────────────────────── */}
      <Card className="p-5 sm:p-6">
        <h2 className="text-base font-semibold text-slate-950">Add a watch</h2>

        {formError && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {formError}
          </div>
        )}
        {formSuccess && (
          <div className="mt-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {formSuccess}
          </div>
        )}

        <form className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-[1.4fr_1fr_1fr_auto] sm:items-end" onSubmit={handleCreateSubmit}>
          <div>
            <label htmlFor="watch-category" className="mb-1.5 block text-sm font-medium text-steel-700">
              Category
            </label>
            <select
              id="watch-category"
              name="category"
              className="input-base"
              value={form.category}
              onChange={handleFormChange}
              required
            >
              <option value="" disabled>
                Select a category…
              </option>
              {categories.map(cat => (
                <option key={cat.slug} value={cat.slug}>
                  {cat.name} ({formatCurrency(cat.priceBDT)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="watch-condition" className="mb-1.5 block text-sm font-medium text-steel-700">
              Notify me when price
            </label>
            <select
              id="watch-condition"
              name="condition"
              className="input-base"
              value={form.condition}
              onChange={handleFormChange}
            >
              <option value="below">Drops below</option>
              <option value="above">Rises above</option>
            </select>
          </div>

          <div>
            <label htmlFor="watch-threshold" className="mb-1.5 block text-sm font-medium text-steel-700">
              Target price (৳)
            </label>
            <input
              id="watch-threshold"
              name="thresholdBDT"
              type="number"
              min="0"
              step="1"
              placeholder="e.g. 1000"
              className="input-base"
              value={form.thresholdBDT}
              onChange={handleFormChange}
              required
            />
          </div>

          <Button id="watch-submit-btn" type="submit" disabled={submitting}>
            {submitting ? 'Adding…' : 'Add Watch'}
          </Button>
        </form>
      </Card>

      {/* ── Watch List ───────────────────────────────────────────────── */}
      <section className="surface-card overflow-hidden">
        <div className="border-b border-concrete-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-950">Your Watches</h2>
          <p className="mt-1 text-sm text-steel-600">
            A triggered watch pauses itself after emailing you, so it won't notify you again every cycle.
          </p>
        </div>

        {rowError && (
          <div className="mx-5 mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {rowError}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-steel-500">Loading watches…</div>
        ) : watches.length === 0 ? (
          <div className="py-16 text-center text-sm text-steel-500">
            You aren't watching any categories yet — add one above.
          </div>
        ) : (
          <div className="divide-y divide-concrete-200">
            {watches.map(watch => {
              const isBusy = busyId === watch._id;
              const isTriggered = watch.status === 'triggered';
              const conditionLabel = watch.condition === 'below' ? 'Drops below' : 'Rises above';

              return (
                <div
                  key={watch._id}
                  className="grid gap-4 px-5 py-4 md:grid-cols-[1.6fr_1fr_auto] md:items-center"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-950">{watch.categoryName}</p>
                      <Badge color={isTriggered ? 'yellow' : 'green'}>
                        {isTriggered ? 'Triggered' : 'Active'}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-steel-600">
                      {conditionLabel} {formatCurrency(watch.thresholdBDT)}
                    </p>
                    {isTriggered && watch.triggeredAt && (
                      <p className="mt-1 text-xs text-steel-400">
                        Triggered {formatDate(watch.triggeredAt)} at {formatCurrency(watch.triggeredAtPriceBDT)}
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm text-steel-600">
                      Live price:{' '}
                      <span className="font-semibold text-navy-900">
                        {watch.currentPriceBDT != null ? formatCurrency(watch.currentPriceBDT) : '—'}
                      </span>
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 md:justify-end">
                    {isTriggered && (
                      <Button size="sm" variant="outline" disabled={isBusy} onClick={() => reactivate(watch._id)}>
                        Reactivate
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={isBusy}
                      onClick={() => removeWatch(watch._id, watch.categoryName)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default Watchlist;
