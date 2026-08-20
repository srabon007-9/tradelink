import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate } from '../../utils/formatters';

const STATUS_COLORS = {
  pending: 'yellow',
  accepted: 'blue',
  completed: 'green',
  disputed: 'red',
  cancelled: 'gray'
};

export default function AdminTrades() {
  const [proposals, setProposals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusTab, setStatusTab] = useState('all');
  const toast = useToast();

  const fetchTrades = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/trades', { params: { status: statusTab } });
      setProposals(res.data.data.proposals);
    } catch {
      toast.error('Failed to load trade proposals.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrades();
  }, [statusTab]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trade Proposal Monitor 🤝"
        description="Monitor system-wide skill trade proposals between requesters and providers across all lifecycle states."
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['all', 'pending', 'accepted', 'completed', 'disputed', 'cancelled'].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusTab(st)}
            className={`capitalize rounded-lg px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
              statusTab === st
                ? 'bg-navy-900 text-white shadow-xs'
                : 'bg-white border border-concrete-300 text-steel-700 hover:bg-concrete-50'
            }`}
          >
            {st === 'all' ? 'All Trades' : st}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : proposals.length === 0 ? (
          <div className="p-8 text-center text-steel-500">
            No trade proposals found under status "{statusTab}".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-concrete-200 bg-concrete-50 text-xs font-semibold uppercase tracking-wider text-steel-600">
                <tr>
                  <th className="px-5 py-3.5">Skill Listing</th>
                  <th className="px-5 py-3.5">Requester</th>
                  <th className="px-5 py-3.5">Provider</th>
                  <th className="px-5 py-3.5">Locked BDT Price</th>
                  <th className="px-5 py-3.5">Session Time</th>
                  <th className="px-5 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-concrete-200">
                {proposals.map(p => (
                  <tr key={p._id} className="hover:bg-concrete-50/50 transition-colors">
                    <td className="px-5 py-4 font-semibold text-navy-900">
                      {p.skillListing?.title || 'Skill Session'}
                      <span className="block text-xs font-normal text-steel-500">
                        {p.skillListing?.category || 'General'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-steel-800">{p.requester?.name || 'Requester'}</p>
                      <p className="text-xs text-steel-500">{p.requester?.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-steel-800">{p.provider?.name || 'Provider'}</p>
                      <p className="text-xs text-steel-500">{p.provider?.email}</p>
                    </td>
                    <td className="px-5 py-4 font-bold text-navy-900">
                      {formatCurrency(p.priceAtProposal || 0)}
                    </td>
                    <td className="px-5 py-4 text-xs font-medium text-steel-600">
                      {p.proposedSessionAt ? formatDate(p.proposedSessionAt) : 'Flexible'}
                    </td>
                    <td className="px-5 py-4">
                      <Badge color={STATUS_COLORS[p.status] || 'gray'}>
                        {p.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
