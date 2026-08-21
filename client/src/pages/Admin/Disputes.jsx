import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function AdminDisputes() {
  const [disputes, setDisputes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const toast = useToast();

  const fetchDisputes = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/trades', { params: { status: 'disputed' } });
      setDisputes(res.data.data.proposals);
    } catch {
      toast.error('Failed to load disputed trade queue.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const handleResolve = async (action) => {
    if (!selectedDispute) return;
    setIsResolving(true);
    try {
      const res = await api.post(`/admin/trades/${selectedDispute._id}/resolve`, {
        action,
        adminNote: adminNote.trim() || undefined
      });
      toast.success(res.data.message);
      setSelectedDispute(null);
      setAdminNote('');
      fetchDisputes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resolve dispute.');
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Disputes & Moderation Queue 🛡️"
        description="Review reported session disputes, inspect transaction details, and execute administrative resolution actions."
      />

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : disputes.length === 0 ? (
          <div className="p-10 text-center text-steel-500">
            <p className="text-2xl mb-1">🎉</p>
            <p className="font-semibold text-navy-900">No Open Disputes</p>
            <p className="text-xs text-steel-500">All member skill sessions are operating smoothly without reports.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-concrete-200 bg-concrete-50 text-xs font-semibold uppercase tracking-wider text-steel-600">
                <tr>
                  <th className="px-5 py-3.5">Session Skill</th>
                  <th className="px-5 py-3.5">Requester</th>
                  <th className="px-5 py-3.5">Provider</th>
                  <th className="px-5 py-3.5">Escrow Amount</th>
                  <th className="px-5 py-3.5">Disputed Date</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-concrete-200">
                {disputes.map(d => (
                  <tr key={d._id} className="hover:bg-concrete-50/50 transition-colors">
                    <td className="px-5 py-4 font-semibold text-navy-900">
                      {d.skillListing?.title || 'Skill Session'}
                    </td>
                    <td className="px-5 py-4 text-xs">
                      <p className="font-semibold text-navy-900">{d.requester?.name}</p>
                      <p className="text-steel-500">{d.requester?.email}</p>
                    </td>
                    <td className="px-5 py-4 text-xs">
                      <p className="font-semibold text-navy-900">{d.provider?.name}</p>
                      <p className="text-steel-500">{d.provider?.email}</p>
                    </td>
                    <td className="px-5 py-4 font-bold text-navy-900">
                      {formatCurrency(d.priceAtProposal || 0)}
                    </td>
                    <td className="px-5 py-4 text-xs font-medium text-steel-600">
                      {formatDate(d.updatedAt)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button variant="primary" size="sm" onClick={() => setSelectedDispute(d)}>
                        Resolve Dispute
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Dispute Resolution Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-concrete-200 pb-3">
              <h3 className="text-lg font-bold text-navy-900">
                Dispute Resolution — {selectedDispute.skillListing?.title}
              </h3>
              <Badge color="red">Disputed</Badge>
            </div>

            <div className="space-y-3 text-xs bg-concrete-50 p-3 rounded-lg border border-concrete-200">
              <div className="flex justify-between">
                <span className="text-steel-600">Requester:</span>
                <span className="font-semibold text-navy-900">{selectedDispute.requester?.name} ({selectedDispute.requester?.email})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-steel-600">Provider:</span>
                <span className="font-semibold text-navy-900">{selectedDispute.provider?.name} ({selectedDispute.provider?.email})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-steel-600">Escrow Value:</span>
                <span className="font-bold text-navy-900">{formatCurrency(selectedDispute.priceAtProposal)}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-steel-700 mb-1">
                Admin Resolution Note (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="State resolution reasoning or policy enforcement notes..."
                value={adminNote}
                onChange={e => setAdminNote(e.target.value)}
                className="input-base text-xs"
              />
            </div>

            <div className="pt-2 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => setSelectedDispute(null)}>
                Cancel
              </Button>
              <button
                type="button"
                disabled={isResolving}
                onClick={() => handleResolve('refund_requester')}
                className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700 transition-colors"
              >
                ↩ Refund Requester
              </button>
              <button
                type="button"
                disabled={isResolving}
                onClick={() => handleResolve('release_provider')}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
              >
                ✓ Release to Provider
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
