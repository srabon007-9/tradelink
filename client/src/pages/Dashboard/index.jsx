/**
 * pages/Dashboard/index.jsx — Live Student Command Center
 *
 * Displays live student overview:
 * - Real-time Credit Wallet Balance & History Summary
 * - Active Skill Listings Overview
 * - Recent Escrow Transactions & Trade Proposals
 * - Quick Action Buttons
 */

import { useEffect, useState, useContext } from 'react';
import { Link, Navigate } from 'react-router-dom';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import AuthContext from '../../context/AuthContext';
import api from '../../services/api';
import { ROUTES } from '../../constants';
import { formatCurrency, formatDate } from '../../utils/formatters';

const TIER_COLORS = {
  gold:  'bg-amber-50 text-amber-700 border-amber-200',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  blue:  'bg-blue-50 text-blue-700 border-blue-200',
  red:   'bg-red-50 text-red-700 border-red-200',
};

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [wallet, setWallet] = useState({ balance: 0, entries: [] });
  const [myListings, setMyListings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [reputation, setReputation] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    if (user?.role === 'admin') return;
    setLoading(true);
    try {
      const [walletRes, listingsRes, txRes, propRes, repRes] = await Promise.all([
        api.get('/wallet/mine').catch(() => ({ data: { data: { balance: 0, entries: [] } } })),
        api.get('/skill-listings/mine').catch(() => ({ data: { data: [] } })),
        api.get('/transactions/mine').catch(() => ({ data: { data: [] } })),
        api.get('/trade-proposals/received').catch(() => ({ data: { data: [] } })),
        api.get('/reputation/me').catch(() => ({ data: { data: null } })),
      ]);

      setWallet(walletRes.data.data || { balance: 0, entries: [] });
      setMyListings(listingsRes.data.data || []);
      setTransactions(txRes.data.data || []);
      setProposals(propRes.data.data || []);
      setReputation(repRes.data.data || null);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role !== 'admin') {
      loadDashboardData();
    }
  }, [user?.role]);

  if (user?.role === 'admin') {
    return <Navigate to="/dashboard/admin/overview" replace />;
  }

  const activeListingsCount = myListings.filter(l => l.status === 'active').length;
  const pendingTransactions = transactions.filter(t => t.status === 'pending').length;
  const pendingProposals = proposals.filter(p => p.status === 'pending').length;

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
            Here is your TradeLink overview: wallet balance, skills offered, trade proposals, and escrow transactions.
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
              💳 Credit Wallet
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
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {/* Credit Balance Card */}
        <Card className="p-5 border-l-4 border-l-navy-900 bg-navy-50/40">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-navy-800">Credit Balance</p>
            <Badge color="green">Live</Badge>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-navy-950">
            {loading ? '…' : `${wallet.balance} Credits`}
          </p>
          <div className="mt-3 flex items-center justify-between text-xs text-steel-600">
            <span>Earn by completing trades</span>
            <Link to={ROUTES.WALLET} className="font-semibold text-navy-800 hover:underline">
              View History →
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
            <span>{myListings.length} total listings</span>
            <Link to={ROUTES.MY_SKILLS} className="font-semibold text-navy-800 hover:underline">
              My Skills →
            </Link>
          </div>
        </Card>

        {/* Pending Proposals Card */}
        <Card className="p-5">
          <p className="text-xs font-semibold text-steel-600">Pending Proposals</p>
          <p className="mt-3 text-3xl font-bold text-amber-700">
            {loading ? '…' : pendingProposals}
          </p>
          <div className="mt-3 flex items-center justify-between text-xs text-steel-600">
            <span>Incoming requests</span>
            <Link to={`${ROUTES.DASHBOARD}/requests`} className="font-semibold text-navy-800 hover:underline">
              Requests →
            </Link>
          </div>
        </Card>

        {/* Escrow Holds Card */}
        <Card className="p-5">
          <p className="text-xs font-semibold text-steel-600">Escrow Holds</p>
          <p className="mt-3 text-3xl font-bold text-emerald-700">
            {loading ? '…' : pendingTransactions}
          </p>
          <div className="mt-3 flex items-center justify-between text-xs text-steel-600">
            <span>Pending confirmation</span>
            <Link to={ROUTES.TRANSACTIONS} className="font-semibold text-navy-800 hover:underline">
              Transactions →
            </Link>
          </div>
        </Card>

        {/* My Trust Score Card */}
        <Card className="p-5 border-l-4 border-l-accent-700 bg-amber-50/30">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-accent-800">Trust Score</p>
            {reputation && (
              <span
                className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold border ${
                  TIER_COLORS[reputation.tierColor] || TIER_COLORS.red
                }`}
              >
                {reputation.tier}
              </span>
            )}
          </div>
          <p className="mt-3 text-3xl font-extrabold text-slate-950">
            {loading ? '…' : reputation ? reputation.score : '—'}
          </p>
          <div className="mt-3 flex items-center justify-between text-xs text-steel-600">
            <span>{reputation ? `${reputation.breakdown.totalReviews} reviews` : 'No data'}</span>
            <Link to="/dashboard/reviews" className="font-semibold text-navy-800 hover:underline">
              Leaderboard →
            </Link>
          </div>
        </Card>
      </div>

      {/* ── Main Content Grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* My Skill Listings Preview */}
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

        {/* Escrow Transactions Activity */}
        <section className="surface-card overflow-hidden">
          <div className="border-b border-concrete-200 px-5 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-950">Recent Transactions</h2>
              <p className="mt-0.5 text-xs text-steel-600">Escrow transactions for accepted trade proposals.</p>
            </div>
            <Link to={ROUTES.TRANSACTIONS} className="text-xs font-semibold text-navy-800 hover:underline">
              View All →
            </Link>
          </div>

          <div className="divide-y divide-concrete-200">
            {loading ? (
              <p className="px-5 py-8 text-center text-sm text-steel-500">Loading transactions…</p>
            ) : transactions.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-steel-600">No active transactions yet.</p>
                <p className="mt-1 text-xs text-steel-500">
                  Transactions appear here when a trade proposal is accepted.
                </p>
              </div>
            ) : (
              transactions.slice(0, 5).map(tx => (
                <div key={tx._id} className="flex items-center justify-between p-4 hover:bg-concrete-50/50 transition-colors">
                  <div className="min-w-0 flex-1 pr-4">
                    <div className="flex items-center gap-2">
                      <Badge color={tx.status === 'paid' ? 'green' : 'yellow'}>
                        {tx.status === 'paid' ? 'Paid' : 'Pending Escrow'}
                      </Badge>
                      <p className="truncate text-sm font-medium text-slate-950">{tx.listingTitle}</p>
                    </div>
                    <p className="mt-1 text-xs text-steel-500">{formatDate(tx.createdAt)}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-bold text-navy-900">{formatCurrency(tx.amount)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
