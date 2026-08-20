import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const toast = useToast();

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data.data);
    } catch {
      toast.error('Failed to load system statistics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRecalculatePrices = async () => {
    setIsRecalculating(true);
    try {
      const res = await api.post('/admin/valuation/recalculate');
      toast.success(res.data.message || 'Valuation recalculated successfully!');
      fetchStats();
    } catch {
      toast.error('Failed to trigger valuation recalculation.');
    } finally {
      setIsRecalculating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="System Overview" description="Loading platform KPIs and operations status..." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Overview 📊"
        description="High-level platform statistics, active trades, escrow balances, and engine triggers."
        action={
          <Button
            variant="primary"
            size="sm"
            isLoading={isRecalculating}
            onClick={handleRecalculatePrices}
          >
            ⚡ Recalculate Skill Valuations
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5 border-l-4 border-l-navy-900 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-steel-500">Registered Members</p>
          <p className="mt-2 text-3xl font-extrabold text-navy-900">{stats?.users?.total ?? 0}</p>
          <div className="mt-2 flex items-center justify-between text-xs text-steel-600">
            <span>Admins: {stats?.users?.admins ?? 0}</span>
            <span className="text-red-600 font-semibold">Suspended: {stats?.users?.suspended ?? 0}</span>
          </div>
        </Card>

        <Card className="p-5 border-l-4 border-l-amber-500 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-steel-500">Active Escrow Volume</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-950">
            {formatCurrency(stats?.trades?.escrowBDT ?? 0)}
          </p>
          <p className="mt-2 text-xs text-steel-600">
            Across {stats?.trades?.active ?? 0} active proposal sessions
          </p>
        </Card>

        <Card className="p-5 border-l-4 border-l-emerald-500 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-steel-500">Completed Trades</p>
          <p className="mt-2 text-3xl font-extrabold text-emerald-900">{stats?.trades?.completed ?? 0}</p>
          <p className="mt-2 text-xs text-steel-600">
            Total verified skill exchanges
          </p>
        </Card>

        <Card className="p-5 border-l-4 border-l-rose-500 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-steel-500">Disputed Sessions</p>
          <p className="mt-2 text-3xl font-extrabold text-rose-600">{stats?.trades?.disputed ?? 0}</p>
          <p className="mt-2 text-xs text-steel-600">
            Requires admin moderation action
          </p>
        </Card>
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-lg font-bold text-navy-900">Skill Directory Health</h3>
          <p className="text-xs text-steel-500 mt-0.5 mb-4">Active listings and category coverage.</p>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-concrete-200 pb-3">
              <span className="text-sm font-semibold text-steel-700">Active Skill Listings</span>
              <span className="text-base font-bold text-navy-900">{stats?.listings?.active ?? 0}</span>
            </div>
            <div className="flex items-center justify-between border-b border-concrete-200 pb-3">
              <span className="text-sm font-semibold text-steel-700">Tracked Skill Categories</span>
              <span className="text-base font-bold text-navy-900">{stats?.listings?.categories ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-steel-700">Member Reviews & Ratings</span>
              <span className="text-base font-bold text-navy-900">{stats?.reviews?.total ?? 0}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-slate-900 text-white shadow-lg">
          <h3 className="text-lg font-bold text-amber-400">Admin Operational Directives</h3>
          <p className="text-xs text-slate-300 mt-0.5 mb-4">Marketplace security & trust guidelines.</p>
          <ul className="space-y-3 text-xs leading-relaxed text-slate-200">
            <li className="flex items-start gap-2">
              <span className="text-amber-400">✓</span>
              <span><strong>Mutual Trade Verification:</strong> Regular skill trades must be completed by both involved members.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400">✓</span>
              <span><strong>Dispute Intervention:</strong> Review reported dispute cases and execute refunds or escrow releases.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400">✓</span>
              <span><strong>Account Moderation:</strong> Instantly suspend users violating community guidelines.</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
