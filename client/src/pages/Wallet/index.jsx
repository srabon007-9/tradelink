/**
 * pages/Wallet/index.jsx — Credit Wallet System
 *
 * Student credit wallet interface:
 * - Persistent balance stored in MongoDB
 * - Summary statistics (Purchased, Earned, Spent, Bonus)
 * - BDT (৳) Credit Packages
 * - Real-time Transaction History
 * - Interactive Dev/Test panel to simulate earning/spending/bonuses
 */

import { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import useAuth from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import walletService from '../../services/wallet.service';
import { formatDate } from '../../utils/formatters';

const PACKAGES = [
  {
    id: 'starter',
    name: 'Starter',
    bdt: 100,
    credits: 100,
    badge: null,
    popular: false,
    description: 'Great for trying out your first skill lesson.',
  },
  {
    id: 'popular',
    name: 'Popular',
    bdt: 500,
    credits: 550,
    badge: '+50 BONUS',
    popular: true,
    description: 'Best value for active student learners.',
  },
  {
    id: 'pro',
    name: 'Pro',
    bdt: 1000,
    credits: 1200,
    badge: '+200 BONUS',
    popular: false,
    description: 'Maximum credits for frequent skill exchanges.',
  },
];

const TYPE_BADGES = {
  purchase: { color: 'green', label: 'Purchase' },
  earned: { color: 'primary', label: 'Earned' },
  spent: { color: 'red', label: 'Spent' },
  bonus: { color: 'yellow', label: 'Bonus' },
};

const Wallet = () => {
  const { refreshWalletBalance } = useAuth();
  const { addToast } = useToast();

  const [summary, setSummary] = useState({
    balance: 0,
    totalPurchased: 0,
    totalEarned: 0,
    totalSpent: 0,
    bonusCredits: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState(null);
  const [testingAction, setTestingAction] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Custom testing form inputs
  const [testAmount, setTestAmount] = useState('10');
  const [testReason, setTestReason] = useState('Requested JavaScript tutoring');

  const loadWalletData = async () => {
    try {
      const [sumData, txData] = await Promise.all([
        walletService.getWallet(),
        walletService.getTransactions(),
      ]);
      setSummary(sumData);
      setTransactions(txData);
    } catch (err) {
      console.error('Failed to load wallet data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWalletData();
  }, []);

  const handlePurchase = async pkg => {
    setMessage({ type: '', text: '' });
    setPurchasingId(pkg.id);

    try {
      // Simulate verified payment reference ID
      const paymentId = `PAY-${Date.now().toString(36).toUpperCase()}`;
      await walletService.purchaseCredits(pkg.id, paymentId);

      const msg = `Successfully purchased ${pkg.credits} Credits for ৳${pkg.bdt}!`;
      setMessage({ type: 'success', text: msg });
      addToast(msg, 'success');
      await loadWalletData();
      refreshWalletBalance();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to complete credit purchase. Please try again.';
      setMessage({ type: 'error', text: msg });
      addToast(msg, 'error');
    } finally {
      setPurchasingId(null);
    }
  };

  const handleDevAction = async actionType => {
    setMessage({ type: '', text: '' });
    const amountNum = parseFloat(testAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      const errMsg = 'Please enter a valid positive credit amount.';
      setMessage({ type: 'error', text: errMsg });
      addToast(errMsg, 'error');
      return;
    }

    setTestingAction(true);
    try {
      const defaultReason =
        actionType === 'earn'
          ? 'Completed JavaScript tutoring'
          : actionType === 'spend'
          ? 'Requested Python tutoring'
          : 'TradeLink activity bonus';

      const finalReason = testReason.trim() || defaultReason;

      await walletService.devAction(actionType, amountNum, finalReason);
      const msg = `Action '${actionType}' recorded successfully!`;
      setMessage({ type: 'success', text: msg });
      addToast(msg, 'success');
      await loadWalletData();
      refreshWalletBalance();
    } catch (err) {
      const msg = err.response?.data?.message || `Failed to process ${actionType} action.`;
      setMessage({ type: 'error', text: msg });
      addToast(msg, 'error');
    } finally {
      setTestingAction(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div>
        <span className="eyebrow mb-2">Credit Wallet System</span>
        <h1 className="text-3xl font-semibold text-slate-950">My Credit Wallet</h1>
        <p className="mt-2 text-sm text-steel-600 max-w-3xl">
          TradeLink Credits are an internal platform currency used to request and provide skills. Buy credits with Bangladeshi Taka (৳) or earn credits by offering your skills to fellow students.
        </p>
      </div>

      {/* ── Status Message Banner ──────────────────────────────────────── */}
      {message.text && (
        <div
          className={`rounded-md p-4 text-sm border ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* ── Balance & Stat Summary Cards ─────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="p-5 border-l-4 border-l-navy-900 bg-navy-50/50 sm:col-span-2 lg:col-span-1">
          <p className="text-xs font-bold uppercase tracking-wider text-navy-800">Current Balance</p>
          <p className="mt-3 text-3xl font-extrabold text-navy-950">
            {loading ? '…' : `${summary.balance} Credits`}
          </p>
          <p className="mt-2 text-xs text-steel-600">Available to spend on skills</p>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-semibold text-steel-600">Total Purchased</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">
            {loading ? '…' : `+${summary.totalPurchased}`}
          </p>
          <p className="mt-1 text-xs text-steel-500">Bought with BDT</p>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-semibold text-steel-600">Total Earned</p>
          <p className="mt-2 text-2xl font-bold text-emerald-700">
            {loading ? '…' : `+${summary.totalEarned}`}
          </p>
          <p className="mt-1 text-xs text-steel-500">From teaching skills</p>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-semibold text-steel-600">Total Spent</p>
          <p className="mt-2 text-2xl font-bold text-red-700">
            {loading ? '…' : `-${summary.totalSpent}`}
          </p>
          <p className="mt-1 text-xs text-steel-500">On learning skills</p>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-semibold text-steel-600">Bonus Credits</p>
          <p className="mt-2 text-2xl font-bold text-amber-700">
            {loading ? '…' : `+${summary.bonusCredits}`}
          </p>
          <p className="mt-1 text-xs text-steel-500">Activity rewards</p>
        </Card>
      </div>

      {/* ── Buy TradeLink Credits ──────────────────────────────────────── */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-950">Buy TradeLink Credits</h2>
          <p className="text-sm text-steel-600">
            Select a package to purchase credits using Bangladeshi Taka (৳). Internal credits cannot be withdrawn as BDT.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {PACKAGES.map(pkg => (
            <Card
              key={pkg.id}
              className={`p-6 flex flex-col justify-between relative transition-shadow ${
                pkg.popular ? 'border-2 border-navy-800 shadow-md' : ''
              }`}
            >
              {pkg.badge && (
                <span className="absolute -top-3 right-4 rounded-full bg-accent-700 px-3 py-0.5 text-[11px] font-bold text-white shadow">
                  {pkg.badge}
                </span>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-950">{pkg.name}</h3>
                  {pkg.popular && <Badge color="primary">Popular</Badge>}
                </div>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-navy-900">৳{pkg.bdt}</span>
                  <span className="text-sm text-steel-500">BDT</span>
                </div>

                <p className="mt-2 text-sm font-semibold text-emerald-800">
                  Receive {pkg.credits} Credits
                </p>

                <p className="mt-3 text-xs leading-relaxed text-steel-600">{pkg.description}</p>
              </div>

              <Button
                size="md"
                fullWidth
                className="mt-6"
                disabled={purchasingId === pkg.id}
                onClick={() => handlePurchase(pkg)}
              >
                {purchasingId === pkg.id ? 'Processing…' : `Buy ${pkg.credits} Credits`}
              </Button>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Interactive Test & Simulation Panel ───────────────────────── */}
      <Card className="p-6 bg-concrete-50/70 border-concrete-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-concrete-200 pb-4 mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-950">Simulate Skill Exchanges & Activity</h3>
            <p className="text-xs text-steel-600">
              Test wallet spending, earning, and activity bonuses directly (simulates future Module trade completions).
            </p>
          </div>
          <Badge color="yellow">Module 2 Tester</Badge>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-steel-700">Credit Amount</label>
            <input
              type="number"
              className="input-base"
              value={testAmount}
              onChange={e => setTestAmount(e.target.value)}
              placeholder="e.g. 10"
              min="1"
            />
          </div>

          <div className="lg:col-span-2">
            <label className="mb-1 block text-xs font-medium text-steel-700">Reason / Description</label>
            <input
              type="text"
              className="input-base"
              value={testReason}
              onChange={e => setTestReason(e.target.value)}
              placeholder="e.g. Requested JavaScript tutoring"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            size="sm"
            variant="outline"
            disabled={testingAction}
            onClick={() => handleDevAction('earn')}
          >
            + Earn Credits (Provide Skill)
          </Button>

          <Button
            size="sm"
            variant="danger"
            disabled={testingAction}
            onClick={() => handleDevAction('spend')}
          >
            - Spend Credits (Request Skill)
          </Button>

          <Button
            size="sm"
            variant="ghost"
            disabled={testingAction}
            onClick={() => handleDevAction('bonus')}
          >
            + Activity Bonus (+2 Credits)
          </Button>
        </div>
      </Card>

      {/* ── Transaction History Table ─────────────────────────────────── */}
      <section className="surface-card overflow-hidden">
        <div className="border-b border-concrete-200 px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-950">Transaction History</h2>
            <p className="mt-0.5 text-xs text-steel-600">
              Permanent immutable records stored in MongoDB (newest transactions first).
            </p>
          </div>
          <Badge color="gray">{transactions.length} total</Badge>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-steel-500">Loading transactions…</div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center text-sm text-steel-500">
            No transactions recorded yet. Buy credits or simulate an exchange above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-steel-700">
              <thead className="border-b border-concrete-200 bg-concrete-50 text-xs font-semibold uppercase tracking-wider text-steel-600">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3 text-right">Credits</th>
                  <th className="px-5 py-3 text-right">Balance After</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-concrete-200">
                {transactions.map(tx => {
                  const badgeCfg = TYPE_BADGES[tx.type] || { color: 'gray', label: tx.type };
                  const isPositive = tx.amount > 0;
                  const formattedAmount = isPositive ? `+${tx.amount}` : `${tx.amount}`;

                  return (
                    <tr key={tx._id} className="hover:bg-concrete-50/50 transition-colors">
                      <td className="whitespace-nowrap px-5 py-3.5 text-xs text-steel-500">
                        {formatDate(tx.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5">
                        <Badge color={badgeCfg.color}>{badgeCfg.label}</Badge>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-950">
                        {tx.description}
                        {tx.bdtAmount ? (
                          <span className="ml-2 text-xs font-normal text-steel-500">
                            (Paid ৳{tx.bdtAmount} BDT)
                          </span>
                        ) : null}
                      </td>
                      <td
                        className={`whitespace-nowrap px-5 py-3.5 text-right font-bold ${
                          isPositive ? 'text-emerald-700' : 'text-red-600'
                        }`}
                      >
                        {formattedAmount}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-right font-semibold text-slate-900">
                        {tx.balanceAfter} Credits
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default Wallet;
