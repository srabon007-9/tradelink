/**
 * pages/Transactions/index.jsx — Escrow System (feature name: "Transaction")
 *
 * Once a trade proposal is accepted, its agreed price opens an escrow hold
 * here. The flow is sequential and ends in a manually-confirmed payment:
 *
 *   1. Provider marks the service as delivered.
 *   2. Requester confirms they received it (only possible after step 1).
 *   3. Requester pays — either:
 *        Offline: a single trusted confirmation (cash/in-person), or
 *        bKash: the requester submits their bKash Transaction ID, and the
 *        provider verifies it matches before funds count as released.
 *
 * This page also has an "My Income" tab — visible to everyone, but always
 * scoped to the logged-in user's own data (GET /transactions/income/mine),
 * so nobody can see another member's earnings or payment history.
 */

import { useEffect, useMemo, useState } from 'react';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';

const STATUS_META = {
  pending: { label: 'Pending Delivery', color: 'yellow' },
  delivered: { label: 'Awaiting Buyer Confirmation', color: 'accent' },
  awaiting_payment: { label: 'Awaiting Payment', color: 'primary' },
  payment_submitted: { label: 'Awaiting Verification', color: 'accent' },
  paid: { label: 'Paid', color: 'green' },
  payment_failed: { label: 'Payment Failed', color: 'red' },
};

const PAYMENT_METHOD_LABELS = {
  offline: 'Offline Payment',
  bkash: 'bKash',
};

const PayAction = ({ transaction, busy, onPayOffline, onPayBkash }) => {
  const [method, setMethod] = useState(null); // null | 'offline' | 'bkash'
  const [bkashId, setBkashId] = useState('');

  if (method === 'offline') {
    return (
      <div className="space-y-2">
        <p className="text-sm text-steel-600">
          Confirm you've paid <span className="font-semibold text-slate-950">{formatCurrency(transaction.amount)}</span>{' '}
          in cash or another offline method.
        </p>
        <div className="flex gap-2">
          <Button size="sm" disabled={busy} onClick={() => onPayOffline(transaction._id)}>
            {busy ? 'Confirming…' : "Confirm — I've Paid Offline"}
          </Button>
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => setMethod(null)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  if (method === 'bkash') {
    return (
      <div className="space-y-2">
        <label htmlFor={`bkash-id-${transaction._id}`} className="block text-xs font-medium text-steel-700">
          bKash Transaction ID
        </label>
        <input
          id={`bkash-id-${transaction._id}`}
          type="text"
          className="input-base"
          placeholder="e.g. 8N7A6QK3XZ"
          value={bkashId}
          onChange={e => setBkashId(e.target.value)}
          maxLength={50}
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            disabled={busy || bkashId.trim().length < 3}
            onClick={() => onPayBkash(transaction._id, bkashId.trim())}
          >
            {busy ? 'Submitting…' : 'Submit for Verification'}
          </Button>
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => setMethod(null)}>
            Cancel
          </Button>
        </div>
        <p className="text-xs text-steel-500">
          The provider will check this Transaction ID against their bKash account before funds are released.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" disabled={busy} onClick={() => setMethod('offline')}>
        Pay Offline
      </Button>
      <Button size="sm" variant="ghost" disabled={busy} onClick={() => setMethod('bkash')}>
        Pay with bKash
      </Button>
    </div>
  );
};

const TransactionCard = ({ transaction, busyId, onDeliver, onReceive, onPayOffline, onPayBkash, onVerifyBkash, onRejectBkash }) => {
  const isRequester = transaction.viewerRole === 'requester';
  const isProvider = !isRequester;
  const counterparty = isRequester ? transaction.provider : transaction.requester;
  const meta = STATUS_META[transaction.status] || STATUS_META.pending;
  const busy = busyId === transaction._id;

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-slate-950">{transaction.listingTitle}</h3>
            <Badge color={meta.color}>{meta.label}</Badge>
          </div>
          <p className="mt-1 text-sm text-steel-600">
            {isRequester ? "You're the requester" : "You're the provider"} — with{' '}
            <span className="font-medium text-steel-800">{counterparty?.name || 'Unknown'}</span>
          </p>
        </div>
        <p className="text-lg font-bold text-navy-900">{formatCurrency(transaction.amount)}</p>
      </div>

      <p className="mt-3 text-xs text-steel-500">Opened {formatDate(transaction.createdAt)}</p>

      {/* ─── Progress trail ─────────────────────────────────────────────── */}
      <div className="mt-3 flex flex-wrap gap-4 rounded-md border border-concrete-200 bg-concrete-50 p-3 text-xs">
        <span className={transaction.providerConfirmed ? 'font-semibold text-emerald-700' : 'text-steel-500'}>
          {transaction.providerConfirmed ? '✓' : '○'} Service delivered
        </span>
        <span className={transaction.requesterConfirmed ? 'font-semibold text-emerald-700' : 'text-steel-500'}>
          {transaction.requesterConfirmed ? '✓' : '○'} Receipt confirmed
        </span>
        <span className={transaction.status === 'paid' ? 'font-semibold text-emerald-700' : 'text-steel-500'}>
          {transaction.status === 'paid' ? '✓' : '○'} Payment released
        </span>
      </div>

      {transaction.status === 'paid' && (
        <p className="mt-3 text-sm font-semibold text-emerald-700">
          ৳{transaction.amount} BDT paid
          {transaction.payment?.method ? ` via ${PAYMENT_METHOD_LABELS[transaction.payment.method] || transaction.payment.method}` : ''} on{' '}
          {formatDate(transaction.payment?.paidAt || transaction.releasedAt)}.
        </p>
      )}

      {/* ─── Action area — one action visible at a time, per role/step ──── */}
      <div className="mt-4">
        {transaction.status === 'pending' && isProvider && (
          <Button size="sm" disabled={busy} onClick={() => onDeliver(transaction._id)}>
            {busy ? 'Confirming…' : 'Mark Service as Delivered'}
          </Button>
        )}
        {transaction.status === 'pending' && isRequester && (
          <p className="text-sm text-steel-600">Waiting for the provider to deliver the service.</p>
        )}

        {transaction.status === 'delivered' && isRequester && (
          <Button size="sm" disabled={busy} onClick={() => onReceive(transaction._id)}>
            {busy ? 'Confirming…' : "Confirm I've Received the Service"}
          </Button>
        )}
        {transaction.status === 'delivered' && isProvider && (
          <p className="text-sm text-steel-600">Waiting for the buyer to confirm they received it.</p>
        )}

        {transaction.status === 'awaiting_payment' && isRequester && (
          <PayAction transaction={transaction} busy={busy} onPayOffline={onPayOffline} onPayBkash={onPayBkash} />
        )}
        {transaction.status === 'awaiting_payment' && isProvider && (
          <p className="text-sm text-steel-600">
            Waiting for {counterparty?.name || 'the buyer'} to complete payment.
          </p>
        )}

        {transaction.status === 'payment_submitted' && isRequester && (
          <p className="text-sm text-steel-600">
            bKash Transaction ID{' '}
            <span className="font-mono font-semibold text-slate-950">{transaction.payment?.bkashTransactionId}</span>{' '}
            submitted — waiting for {counterparty?.name || 'the provider'} to verify it.
          </p>
        )}
        {transaction.status === 'payment_submitted' && isProvider && (
          <div className="space-y-2">
            <p className="text-sm text-steel-600">
              {counterparty?.name || 'The buyer'} submitted this bKash Transaction ID — check your bKash account for
              a matching payment of {formatCurrency(transaction.amount)}:
            </p>
            <p className="rounded-md border border-concrete-200 bg-concrete-50 px-3 py-2 font-mono text-sm font-semibold text-slate-950">
              {transaction.payment?.bkashTransactionId}
            </p>
            <div className="flex gap-2">
              <Button size="sm" disabled={busy} onClick={() => onVerifyBkash(transaction._id)}>
                {busy ? 'Confirming…' : 'Confirm — Matches'}
              </Button>
              <Button size="sm" variant="danger" disabled={busy} onClick={() => onRejectBkash(transaction._id)}>
                Reject — Doesn't Match
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

const IncomeTab = () => {
  const [income, setIncome] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/transactions/income/mine')
      .then(res => setIncome(res.data.data))
      .catch(() => setIncome({ totalIncome: 0, count: 0, transactions: [] }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-16 text-sm text-steel-600">Loading your income…</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="text-sm text-steel-600">Total confirmed income</p>
        <p className="mt-1 text-3xl font-bold text-navy-900">{formatCurrency(income.totalIncome)}</p>
        <p className="mt-1 text-xs text-steel-500">
          From {income.count} paid transaction{income.count === 1 ? '' : 's'} — visible only to you.
        </p>
      </Card>

      {income.transactions.length === 0 ? (
        <div className="rounded-lg border border-concrete-200 bg-concrete-50 py-16 text-center">
          <p className="text-base font-semibold text-slate-950">No paid transactions yet</p>
          <p className="mt-2 text-sm text-steel-600">Completed, paid transactions where you're the provider show up here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {income.transactions.map(t => (
            <Card key={t._id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="text-sm font-semibold text-slate-950">{t.listingTitle}</p>
                <p className="text-xs text-steel-500">
                  From {t.requester?.name || 'Unknown'} · Paid {formatDate(t.payment?.paidAt)}
                  {t.payment?.method ? ` · ${PAYMENT_METHOD_LABELS[t.payment.method] || t.payment.method}` : ''}
                </p>
              </div>
              <p className="text-base font-bold text-emerald-700">+{formatCurrency(t.amount)}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

const Transactions = () => {
  const [tab, setTab] = useState('transactions'); // 'transactions' | 'income'
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    setLoading(true);
    api
      .get('/transactions/mine')
      .then(res => setTransactions(res.data.data))
      .catch(() => setTransactions([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const runAction = async (id, path, method = 'patch', body) => {
    setError('');
    setBusyId(id);
    try {
      await api[method](`/transactions/${id}/${path}`, body);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDeliver = id => runAction(id, 'deliver');
  const handleReceive = id => runAction(id, 'receive');
  const handlePayOffline = id => runAction(id, 'pay/offline', 'post');
  const handlePayBkash = (id, bkashTransactionId) => runAction(id, 'pay/bkash', 'post', { bkashTransactionId });
  const handleVerifyBkash = id => runAction(id, 'verify-bkash');
  const handleRejectBkash = id => runAction(id, 'reject-bkash');

  const openCount = useMemo(
    () => transactions.filter(t => !['paid'].includes(t.status)).length,
    [transactions]
  );

  return (
    <div className="space-y-6">
      <div>
        <span className="eyebrow mb-2">Escrow System</span>
        <h1 className="text-3xl font-semibold text-slate-950">Transactions & Escrow</h1>
        <p className="mt-2 text-sm text-steel-600">
          When a trade proposal is accepted, its agreed price opens an escrow hold here. The provider
          delivers, the buyer confirms, then the buyer pays offline or with bKash — funds only count as
          released once payment is confirmed.
        </p>
      </div>

      <div className="flex gap-2 border-b border-concrete-200">
        <button
          onClick={() => setTab('transactions')}
          className={`px-4 py-2 text-sm font-semibold transition-colors ${
            tab === 'transactions' ? 'border-b-2 border-navy-800 text-navy-900' : 'text-steel-600 hover:text-steel-800'
          }`}
        >
          Transactions
        </button>
        <button
          onClick={() => setTab('income')}
          className={`px-4 py-2 text-sm font-semibold transition-colors ${
            tab === 'income' ? 'border-b-2 border-navy-800 text-navy-900' : 'text-steel-600 hover:text-steel-800'
          }`}
        >
          My Income
        </button>
      </div>

      {tab === 'income' ? (
        <IncomeTab />
      ) : (
        <>
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          {loading ? (
            <div className="flex justify-center py-16 text-sm text-steel-600">Loading transactions…</div>
          ) : transactions.length === 0 ? (
            <div className="rounded-lg border border-concrete-200 bg-concrete-50 py-16 text-center">
              <p className="text-base font-semibold text-slate-950">No transactions yet</p>
              <p className="mt-2 text-sm text-steel-600">
                Transactions appear here automatically once an accepted trade proposal opens an escrow hold.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {openCount > 0 && (
                <p className="text-sm text-steel-600">
                  <span className="font-semibold text-slate-950">{openCount}</span> transaction{openCount !== 1 ? 's' : ''} in progress
                </p>
              )}
              {transactions.map(t => (
                <TransactionCard
                  key={t._id}
                  transaction={t}
                  busyId={busyId}
                  onDeliver={handleDeliver}
                  onReceive={handleReceive}
                  onPayOffline={handlePayOffline}
                  onPayBkash={handlePayBkash}
                  onVerifyBkash={handleVerifyBkash}
                  onRejectBkash={handleRejectBkash}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Transactions;
