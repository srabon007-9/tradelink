/**
 * pages/Transactions/index.jsx — Escrow System (feature name: "Transaction")
 *
 * Once a trade proposal is accepted, the agreed price is held in escrow
 * here — "pending" — instead of being released to the provider right
 * away. It only becomes "released" once BOTH the requester and the
 * provider confirm the work/session was completed, which is what
 * protects either side from the other backing out mid-trade.
 */

import { useEffect, useState } from 'react';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate } from '../../utils/formatters';

const TransactionCard = ({ transaction, busy, onConfirm }) => {
  const isRequester = transaction.viewerRole === 'requester';
  const counterparty = isRequester ? transaction.provider : transaction.requester;
  const myConfirmed = isRequester ? transaction.requesterConfirmed : transaction.providerConfirmed;
  const theirConfirmed = isRequester ? transaction.providerConfirmed : transaction.requesterConfirmed;
  const isReleased = transaction.status === 'released';

  return (
    <article className="surface-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-slate-950">{transaction.listingTitle}</h3>
            <Badge color={isReleased ? 'green' : 'yellow'}>{isReleased ? 'Released' : 'Pending Escrow'}</Badge>
          </div>
          <p className="mt-1 text-sm text-steel-600">
            {isRequester ? "You're the requester" : "You're the provider"} — with{' '}
            <span className="font-medium text-steel-800">{counterparty?.name || 'Unknown'}</span>
          </p>
        </div>
        <p className="text-lg font-bold text-navy-900">{formatCurrency(transaction.amount)}</p>
      </div>

      <p className="mt-3 text-xs text-steel-500">Opened {formatDate(transaction.createdAt)}</p>

      <div className="mt-3 rounded-md border border-concrete-200 bg-concrete-50 p-3 text-sm text-steel-700">
        {isReleased ? (
          <span className="font-semibold text-emerald-700">
            Both parties confirmed — {formatCurrency(transaction.amount)} released to the provider.
          </span>
        ) : (
          <>
            {formatCurrency(transaction.amount)} is held in escrow until both sides confirm the work was completed.
            <div className="mt-2 flex flex-wrap gap-4 text-xs">
              <span className={transaction.requesterConfirmed ? 'text-emerald-700 font-semibold' : 'text-steel-500'}>
                {transaction.requesterConfirmed ? '✓' : '○'} Requester confirmed
              </span>
              <span className={transaction.providerConfirmed ? 'text-emerald-700 font-semibold' : 'text-steel-500'}>
                {transaction.providerConfirmed ? '✓' : '○'} Provider confirmed
              </span>
            </div>
          </>
        )}
      </div>

      {!isReleased && (
        <div className="mt-4">
          {myConfirmed ? (
            <p className="text-sm text-steel-600">
              You've confirmed. Waiting for {counterparty?.name || 'the other party'} to confirm before funds release.
            </p>
          ) : (
            <Button size="sm" disabled={busy} onClick={onConfirm}>
              {busy ? 'Confirming…' : 'Confirm Work Completed'}
            </Button>
          )}
          {theirConfirmed && !myConfirmed && (
            <p className="mt-1.5 text-xs text-steel-500">{counterparty?.name || 'The other party'} has already confirmed.</p>
          )}
        </div>
      )}
    </article>
  );
};

const Transactions = () => {
  const { addToast } = useToast();
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

  const confirm = async id => {
    setError('');
    setBusyId(id);
    try {
      const res = await api.patch(`/transactions/${id}/confirm`);
      const updatedTx = res.data.data;
      if (updatedTx?.status === 'released') {
        addToast('Work confirmed! Escrow released & credit wallet points awarded 🎉', 'success');
      } else {
        addToast('Completion confirmed. Waiting for the other party to confirm.', 'info');
      }
      load();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to confirm. Please try again.';
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setBusyId(null);
    }
  };

  const pendingCount = transactions.filter(t => t.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div>
        <span className="eyebrow mb-2">Escrow System</span>
        <h1 className="text-3xl font-semibold text-slate-950">Transactions & Escrow</h1>
        <p className="mt-2 text-sm text-steel-600">
          When a trade proposal is accepted, its agreed price moves here and is held in escrow. It only
          releases to the provider once both of you confirm the work was completed.
        </p>
      </div>

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
          {pendingCount > 0 && (
            <p className="text-sm text-steel-600">
              <span className="font-semibold text-slate-950">{pendingCount}</span> pending escrow
              {pendingCount !== 1 ? 's' : ''}
            </p>
          )}
          {transactions.map(t => (
            <TransactionCard
              key={t._id}
              transaction={t}
              busy={busyId === t._id}
              onConfirm={() => confirm(t._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Transactions;
