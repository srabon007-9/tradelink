/**
 * pages/Transactions/index.jsx — Escrow System (feature name: "Transaction")
 *
 * Once a trade proposal is accepted, its agreed price opens an escrow hold
 * here. The flow is now sequential and involves a real payment:
 *
 *   1. Provider marks the service as delivered.
 *   2. Requester confirms they received it (only possible after step 1).
 *   3. Requester pays via SSLCommerz — a hosted page where they pick their
 *      own payment method (card, bKash, Nagad, etc). TradeLink never
 *      touches card/wallet details directly.
 *   4. Once SSLCommerz validates the payment server-side, the transaction is
 *      marked "paid" and counts toward the provider's income.
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
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate } from '../../utils/formatters';

const STATUS_META = {
  pending: { label: 'Pending Delivery', color: 'yellow' },
  delivered: { label: 'Awaiting Buyer Confirmation', color: 'accent' },
  awaiting_payment: { label: 'Awaiting Payment', color: 'primary' },
  paid: { label: 'Paid', color: 'green' },
  payment_failed: { label: 'Payment Failed', color: 'red' },
};

const PaymentBanner = ({ payment, onDismiss }) => {
  if (!payment) return null;

  const COPY = {
    success: {
      color: 'border-emerald-200 bg-emerald-50 text-emerald-800',
      text: 'Payment confirmed — funds released to the provider.',
    },
    failed: {
      color: 'border-red-200 bg-red-50 text-red-800',
      text: 'Payment could not be validated. You can retry below.',
    },
    cancelled: {
      color: 'border-amber-200 bg-amber-50 text-amber-800',
      text: 'Payment was cancelled. You can retry below.',
    },
  };

  const meta = COPY[payment] || COPY.failed;

  return (
    <div
      className={`flex items-center justify-between rounded-md border px-4 py-3 text-sm ${meta.color}`}
    >
      <span>{meta.text}</span>

      <button
        onClick={onDismiss}
        className="text-xs font-semibold underline underline-offset-2"
      >
        Dismiss
      </button>
    </div>
  );
};

const TransactionCard = ({
  transaction,
  busyId,
  onDeliver,
  onReceive,
  onPay,
}) => {
  const isRequester = transaction.viewerRole === 'requester';
  const isProvider = !isRequester;
  const counterparty = isRequester
    ? transaction.provider
    : transaction.requester;

  const meta =
    STATUS_META[transaction.status] || STATUS_META.pending;

  const busy = busyId === transaction._id;

  // FIX: isReleased was being used but never defined.
  const isReleased =
    transaction.status === 'released' ||
    transaction.status === 'paid';

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-slate-950">
              {transaction.listingTitle}
            </h3>

            <Badge color={meta.color}>{meta.label}</Badge>
          </div>

          <p className="mt-1 text-sm text-steel-600">
            {isRequester
              ? "You're the requester"
              : "You're the provider"}{' '}
            — with{' '}
            <span className="font-medium text-steel-800">
              {counterparty?.name || 'Unknown'}
            </span>
          </p>
        </div>

        <p className="text-lg font-bold text-navy-900">
          {formatCurrency(transaction.amount)}
        </p>
      </div>

      <p className="mt-3 text-xs text-steel-500">
        Opened {formatDate(transaction.createdAt)}
      </p>

      <div className="mt-3 rounded-md border border-concrete-200 bg-concrete-50 p-3 text-sm text-steel-700">
        {isReleased ? (
          <span className="font-semibold text-emerald-700">
            Both parties confirmed —{' '}
            {formatCurrency(transaction.amount)} released to the provider.
          </span>
        ) : (
          <>
            {formatCurrency(transaction.amount)} is held in escrow until both
            sides confirm the work was completed.

            <div className="mt-2 flex flex-wrap gap-4 text-xs">
              <span
                className={
                  transaction.requesterConfirmed
                    ? 'text-emerald-700 font-semibold'
                    : 'text-steel-500'
                }
              >
                {transaction.requesterConfirmed ? '✓' : '○'} Requester
                confirmed
              </span>

              <span
                className={
                  transaction.providerConfirmed
                    ? 'text-emerald-700 font-semibold'
                    : 'text-steel-500'
                }
              >
                {transaction.providerConfirmed ? '✓' : '○'} Provider
                confirmed
              </span>
            </div>
          </>
        )}
      </div>

      {transaction.status === 'paid' && (
        <p className="mt-3 text-sm font-semibold text-emerald-700">
          ৳{transaction.amount} BDT paid
          {transaction.payment?.method
            ? ` via ${transaction.payment.method}`
            : ''}{' '}
          on{' '}
          {formatDate(
            transaction.payment?.paidAt || transaction.releasedAt
          )}
          .
        </p>
      )}

      {/* ─── Action area — one action visible at a time, per role/step ──── */}
      <div className="mt-4">
        {transaction.status === 'pending' && isProvider && (
          <Button
            size="sm"
            disabled={busy}
            onClick={() => onDeliver(transaction._id)}
          >
            {busy ? 'Confirming…' : 'Mark Service as Delivered'}
          </Button>
        )}

        {transaction.status === 'pending' && isRequester && (
          <p className="text-sm text-steel-600">
            Waiting for the provider to deliver the service.
          </p>
        )}

        {transaction.status === 'delivered' && isRequester && (
          <Button
            size="sm"
            disabled={busy}
            onClick={() => onReceive(transaction._id)}
          >
            {busy ? 'Confirming…' : "Confirm I've Received the Service"}
          </Button>
        )}

        {transaction.status === 'delivered' && isProvider && (
          <p className="text-sm text-steel-600">
            Waiting for the buyer to confirm they received it.
          </p>
        )}

        {(transaction.status === 'awaiting_payment' ||
          transaction.status === 'payment_failed') &&
          isRequester && (
            <div>
              <Button
                size="sm"
                disabled={busy}
                onClick={() => onPay(transaction._id)}
              >
                {busy
                  ? 'Opening payment…'
                  : transaction.status === 'payment_failed'
                    ? 'Retry Payment'
                    : 'Pay Now'}
              </Button>

              <p className="mt-1.5 text-xs text-steel-500">
                You'll be redirected to SSLCommerz to choose card, mobile
                banking, or another payment method.
              </p>
            </div>
          )}

        {(transaction.status === 'awaiting_payment' ||
          transaction.status === 'payment_failed') &&
          isProvider && (
            <p className="text-sm text-steel-600">
              Waiting for {counterparty?.name || 'the buyer'} to complete
              payment.
            </p>
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
      .then((res) => setIncome(res.data.data))
      .catch(() =>
        setIncome({
          totalIncome: 0,
          count: 0,
          transactions: [],
        })
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16 text-sm text-steel-600">
        Loading your income…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="text-sm text-steel-600">
          Total confirmed income
        </p>

        <p className="mt-1 text-3xl font-bold text-navy-900">
          {formatCurrency(income.totalIncome)}
        </p>

        <p className="mt-1 text-xs text-steel-500">
          From {income.count} paid transaction
          {income.count === 1 ? '' : 's'} — visible only to you.
        </p>
      </Card>

      {income.transactions.length === 0 ? (
        <div className="rounded-lg border border-concrete-200 bg-concrete-50 py-16 text-center">
          <p className="text-base font-semibold text-slate-950">
            No paid transactions yet
          </p>

          <p className="mt-2 text-sm text-steel-600">
            Completed, paid transactions where you're the provider show up
            here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {income.transactions.map((t) => (
            <Card
              key={t._id}
              className="flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div>
                <p className="text-sm font-semibold text-slate-950">
                  {t.listingTitle}
                </p>

                <p className="text-xs text-steel-500">
                  From {t.requester?.name || 'Unknown'} · Paid{' '}
                  {formatDate(t.payment?.paidAt)}
                  {t.payment?.method
                    ? ` · ${t.payment.method}`
                    : ''}
                </p>
              </div>

              <p className="text-base font-bold text-emerald-700">
                +{formatCurrency(t.amount)}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

const Transactions = () => {
  const { addToast } = useToast();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [paymentBanner, setPaymentBanner] = useState(null);

  // FIX: tab was being used but was never defined.
  const [tab, setTab] = useState('transactions');

  const load = () => {
    setLoading(true);

    api
      .get('/transactions/mine')
      .then((res) => setTransactions(res.data.data))
      .catch(() => setTransactions([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();

    // Pick up ?payment=success|failed|cancelled from the SSLCommerz redirect,
    // show a banner, then clean the URL so refreshing doesn't re-show it.
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');

    if (payment) {
      setPaymentBanner(payment);
      window.history.replaceState(
        {},
        '',
        window.location.pathname
      );
    }
  }, []);

  const runAction = async (
    id,
    path,
    method = 'patch'
  ) => {
    setError('');
    setBusyId(id);

    try {
      const res = await api.patch(
        `/transactions/${id}/confirm`
      );

      const updatedTx = res.data.data;

      if (updatedTx?.status === 'released') {
        addToast(
          'Work confirmed! Escrow released & credit wallet points awarded 🎉',
          'success'
        );
      } else {
        addToast(
          'Completion confirmed. Waiting for the other party to confirm.',
          'info'
        );
      }

      load();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        'Failed to confirm. Please try again.';

      setError(msg);
      addToast(msg, 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleDeliver = (id) =>
    runAction(id, 'deliver');

  const handleReceive = (id) =>
    runAction(id, 'receive');

  const handlePay = async (id) => {
    setError('');
    setBusyId(id);

    try {
      const res = await api.post(
        `/transactions/${id}/pay`
      );

      // Full-page redirect to SSLCommerz's hosted payment page — this is
      // where the buyer picks their own payment method.
      window.location.href =
        res.data.data.gatewayUrl;
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Could not start the payment. Please try again.'
      );

      setBusyId(null);
    }
  };

  const openCount = useMemo(
    () =>
      transactions.filter(
        (t) => !['paid'].includes(t.status)
      ).length,
    [transactions]
  );

  return (
    <div className="space-y-6">
      <div>
        <span className="eyebrow mb-2">
          Escrow System
        </span>

        <h1 className="text-3xl font-semibold text-slate-950">
          Transactions & Escrow
        </h1>

        <p className="mt-2 text-sm text-steel-600">
          When a trade proposal is accepted, its agreed price opens an
          escrow hold here. The provider delivers, the buyer confirms,
          then the buyer pays — funds only count as released once payment
          is confirmed.
        </p>
      </div>

      <div className="flex gap-2 border-b border-concrete-200">
        <button
          onClick={() => setTab('transactions')}
          className={`px-4 py-2 text-sm font-semibold transition-colors ${
            tab === 'transactions'
              ? 'border-b-2 border-navy-800 text-navy-900'
              : 'text-steel-600 hover:text-steel-800'
          }`}
        >
          Transactions
        </button>

        <button
          onClick={() => setTab('income')}
          className={`px-4 py-2 text-sm font-semibold transition-colors ${
            tab === 'income'
              ? 'border-b-2 border-navy-800 text-navy-900'
              : 'text-steel-600 hover:text-steel-800'
          }`}
        >
          My Income
        </button>
      </div>

      {tab === 'income' ? (
        <IncomeTab />
      ) : (
        <>
          <PaymentBanner
            payment={paymentBanner}
            onDismiss={() => setPaymentBanner(null)}
          />

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-16 text-sm text-steel-600">
              Loading transactions…
            </div>
          ) : transactions.length === 0 ? (
            <div className="rounded-lg border border-concrete-200 bg-concrete-50 py-16 text-center">
              <p className="text-base font-semibold text-slate-950">
                No transactions yet
              </p>

              <p className="mt-2 text-sm text-steel-600">
                Transactions appear here automatically once an accepted
                trade proposal opens an escrow hold.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {openCount > 0 && (
                <p className="text-sm text-steel-600">
                  <span className="font-semibold text-slate-950">
                    {openCount}
                  </span>{' '}
                  transaction
                  {openCount !== 1 ? 's' : ''} in progress
                </p>
              )}

              {transactions.map((t) => (
                <TransactionCard
                  key={t._id}
                  transaction={t}
                  busyId={busyId}
                  onDeliver={handleDeliver}
                  onReceive={handleReceive}
                  onPay={handlePay}
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