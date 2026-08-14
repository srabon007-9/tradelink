/**
 * pages/Dashboard/index.jsx — Live Student Command Center
 *
 * Displays live student data from MongoDB:
 * - Real-time Credit Wallet Balance & Statistics
 * - Active Skill Listings Overview (Module 1)
 * - Recent Wallet Activity Stream (Module 2)
 * - Quick Action Buttons
 */

import { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import AuthContext from '../../context/AuthContext';
import api from '../../services/api';
import walletService from '../../services/wallet.service';
import { ROUTES } from '../../constants';
import { formatDate } from '../../utils/formatters';

const TYPE_BADGES = {
  purchase: { color: 'green', label: 'Purchase' },
  earned: { color: 'primary', label: 'Earned' },
  spent: { color: 'red', label: 'Spent' },
  bonus: { color: 'yellow', label: 'Bonus' },
};

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [walletSummary, setWalletSummary] = useState({
    balance: 0,
    totalPurchased: 0,
    totalEarned: 0,
    totalSpent: 0,
    bonusCredits: 0,
  });
  const [myListings, setMyListings] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [walletRes, listingsRes, txRes] = await Promise.all([
        walletService.getWallet(),
        api.get('/skill-listings/mine'),
        walletService.getTransactions(),
      ]);

      setWalletSummary(walletRes);
      setMyListings(listingsRes.data.data || []);
      setRecentTransactions(txRes.slice(0, 5) || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const activeListingsCount = myListings.filter(l => l.status === 'active').length;

  return (
    <div className="space-y-8">
      {/* ── Header & Quick Actions ───────────────────────────────────── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <span className="eyebrow mb-2">Student Command Center</span>
          <h1 className="text-3xl font-semibold text-slate-950">
            Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
          </h1>
          <p className="mt-1 text-sm text-steel-600">
            Here is your TradeLink overview: skills offered, wallet balance, and recent activity.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap gap-2.5">
          <Link to={ROUTES.MY_SKILLS}>
            <Button size="sm" variant="primary">
              + Add Skill
            </Button>
          </Link>
          <Link to={ROUTES.WALLET}>
            <Button size="sm" variant="outline">
              + Buy Credits
            </Button>
          </Link>
          <Link to={ROUTES.BROWSE}>
            <Button size="sm" variant="ghost">
              🔍 Browse Directory
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Live Stat Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Credit Balance Card */}
        <Card className="p-5 border-l-4 border-l-navy-900 bg-navy-50/40">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-navy-800">Credit Balance</p>
            <Badge color="green">Live</Badge>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-navy-950">
            {loading ? '…' : `${walletSummary.balance} Credits`}
          </p>
          <div className="mt-3 flex items-center justify-between text-xs text-steel-600">
            <span>Platform Currency</span>
            <Link to={ROUTES.WALLET} className="font-semibold text-navy-800 hover:underline">
              Manage Wallet →
            </Link>
          </div>
        </Card>

        {/* Skills Offered Card */}
        <Card className="p-5">
          <p className="text-xs font-semibold text-steel-600">Active Skill Listings</p>
          <p className="mt-3 text-3xl font-bold text-slate-950">
            {loading ? '…' : activeListingsCount}
          </p>
          <div className="mt-3 flex items-center justify-between text-xs text-steel-600">
            <span>{myListings.length} total created</span>
            <Link to={ROUTES.MY_SKILLS} className="font-semibold text-navy-800 hover:underline">
              My Skills →
            </Link>
          </div>
        </Card>

        {/* Total Earned Card */}
        <Card className="p-5">
          <p className="text-xs font-semibold text-steel-600">Credits Earned</p>
          <p className="mt-3 text-3xl font-bold text-emerald-700">
            {loading ? '…' : `+${walletSummary.totalEarned}`}
          </p>
          <p className="mt-3 text-xs text-steel-500">From completed skill lessons</p>
        </Card>

        {/* Total Spent Card */}
        <Card className="p-5">
          <p className="text-xs font-semibold text-steel-600">Credits Spent</p>
          <p className="mt-3 text-3xl font-bold text-red-700">
            {loading ? '…' : `-${walletSummary.totalSpent}`}
          </p>
          <p className="mt-3 text-xs text-steel-500">On skill exchange requests</p>
        </Card>
      </div>

      {/* ── Main Content Grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Module 1: My Skill Listings Preview */}
        <section className="surface-card overflow-hidden">
          <div className="border-b border-concrete-200 px-5 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-950">My Skill Listings</h2>
              <p className="mt-0.5 text-xs text-steel-600">Skills you are currently offering on TradeLink.</p>
            </div>
            <Link to={ROUTES.MY_SKILLS} className="text-xs font-semibold text-navy-800 hover:underline">
              View All ({myListings.length})
            </Link>
          </div>

          <div className="divide-y divide-concrete-200">
            {loading ? (
              <p className="px-5 py-8 text-center text-sm text-steel-500">Loading listings…</p>
            ) : myListings.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-steel-600">You haven't listed any skills yet.</p>
                <Link to={ROUTES.MY_SKILLS} className="mt-2 inline-block text-xs font-semibold text-navy-800 hover:underline">
                  + Create your first skill listing
                </Link>
              </div>
            ) : (
              myListings.slice(0, 4).map(listing => (
                <div key={listing._id} className="flex items-center justify-between p-4 hover:bg-concrete-50/50 transition-colors">
                  <div className="min-w-0 flex-1 pr-4">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-slate-950">{listing.title}</p>
                      <Badge color={listing.status === 'active' ? 'green' : 'gray'}>
                        {listing.status === 'active' ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="mt-1 truncate text-xs text-steel-600">{listing.description}</p>
                  </div>
                  <span className="text-xs font-medium text-steel-500 capitalize">
                    {listing.category === 'other' ? listing.customCategoryName || 'Other' : listing.category}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Module 2: Recent Wallet Activity */}
        <section className="surface-card overflow-hidden">
          <div className="border-b border-concrete-200 px-5 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-950">Recent Wallet Activity</h2>
              <p className="mt-0.5 text-xs text-steel-600">Your recent credit purchases, earnings, and spends.</p>
            </div>
            <Link to={ROUTES.WALLET} className="text-xs font-semibold text-navy-800 hover:underline">
              View Wallet →
            </Link>
          </div>

          <div className="divide-y divide-concrete-200">
            {loading ? (
              <p className="px-5 py-8 text-center text-sm text-steel-500">Loading transactions…</p>
            ) : recentTransactions.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-steel-600">No transactions recorded yet.</p>
                <Link to={ROUTES.WALLET} className="mt-2 inline-block text-xs font-semibold text-navy-800 hover:underline">
                  + Buy credits to get started
                </Link>
              </div>
            ) : (
              recentTransactions.map(tx => {
                const badgeCfg = TYPE_BADGES[tx.type] || { color: 'gray', label: tx.type };
                const isPositive = tx.amount > 0;
                const formattedAmount = isPositive ? `+${tx.amount}` : `${tx.amount}`;

                return (
                  <div key={tx._id} className="flex items-center justify-between p-4 hover:bg-concrete-50/50 transition-colors">
                    <div className="min-w-0 flex-1 pr-4">
                      <div className="flex items-center gap-2">
                        <Badge color={badgeCfg.color}>{badgeCfg.label}</Badge>
                        <p className="truncate text-sm font-medium text-slate-950">{tx.description}</p>
                      </div>
                      <p className="mt-1 text-xs text-steel-500">{formatDate(tx.createdAt)}</p>
                    </div>

                    <div className="text-right">
                      <p className={`text-sm font-bold ${isPositive ? 'text-emerald-700' : 'text-red-600'}`}>
                        {formattedAmount} Cr
                      </p>
                      <p className="text-[11px] text-steel-500">{tx.balanceAfter} Cr balance</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
