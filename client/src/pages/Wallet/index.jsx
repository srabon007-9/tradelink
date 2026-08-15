/**
 * pages/Wallet/index.jsx — Credit Wallet System
 *
 * Shows the logged-in user's credit balance and full earn/redeem
 * history. Credits are earned automatically when a trade completes (see
 * Transactions/Escrow) and can be redeemed toward a future trade's cost
 * from the Browse Skills booking flow — this page is read-only.
 */

import { useEffect, useState } from 'react';
import Badge from '../../components/ui/Badge';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';

const Wallet = () => {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/wallet/mine')
      .then(res => setWallet(res.data.data))
      .catch(() => setWallet({ balance: 0, entries: [], creditValueInBDT: 10, maxDiscountPercent: 20 }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-16 text-sm text-steel-600">Loading your wallet…</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <span className="eyebrow mb-2">Credit Wallet System</span>
        <h1 className="text-3xl font-semibold text-slate-950">Wallet</h1>
        <p className="mt-2 text-sm text-steel-600">
          Earn credits by completing trades — as either the provider or the requester — and redeem them for
          a discount off a future trade's money cost.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="surface-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-steel-500">Credit Balance</p>
          <p className="mt-2 text-3xl font-bold text-navy-900">{wallet.balance}</p>
          <p className="mt-1 text-xs text-steel-500">credits available</p>
        </div>
        <div className="surface-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-steel-500">Redemption Value</p>
          <p className="mt-2 text-3xl font-bold text-navy-900">{formatCurrency(wallet.creditValueInBDT)}</p>
          <p className="mt-1 text-xs text-steel-500">per credit redeemed</p>
        </div>
        <div className="surface-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-steel-500">Max Discount</p>
          <p className="mt-2 text-3xl font-bold text-navy-900">{wallet.maxDiscountPercent}%</p>
          <p className="mt-1 text-xs text-steel-500">of a trade's price, per trade</p>
        </div>
      </div>

      <section className="surface-card overflow-hidden">
        <div className="border-b border-concrete-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-950">History</h2>
          <p className="mt-1 text-sm text-steel-600">Every credit you've earned or redeemed, most recent first.</p>
        </div>

        {wallet.entries.length === 0 ? (
          <div className="py-16 text-center text-sm text-steel-500">
            No activity yet — complete a trade to start earning credits.
          </div>
        ) : (
          <div className="divide-y divide-concrete-200">
            {wallet.entries.map(entry => (
              <div key={entry._id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge color={entry.type === 'earned' ? 'green' : 'yellow'}>
                      {entry.type === 'earned' ? 'Earned' : 'Redeemed'}
                    </Badge>
                    <p className="truncate text-sm text-slate-950">{entry.reason}</p>
                  </div>
                  <p className="mt-1 text-xs text-steel-500">{formatDate(entry.createdAt)}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className={`text-sm font-bold ${entry.type === 'earned' ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {entry.type === 'earned' ? '+' : '−'}
                    {entry.amount}
                  </p>
                  <p className="text-xs text-steel-400">balance: {entry.balanceAfter}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Wallet;
