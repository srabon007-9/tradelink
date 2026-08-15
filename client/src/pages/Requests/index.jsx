/**
 * pages/Requests/index.jsx — Trade Proposal Builder With Session Scheduling
 *
 * Manage trade proposals: ones you sent (as a requester booking someone
 * else's listing) and ones you received (as a provider on your own
 * listings). Accepting a received proposal locks in the session and
 * triggers a shared Google Calendar invite for both people.
 */

import { useEffect, useState } from 'react';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';

const STATUS_COLORS = {
  pending: 'yellow',
  accepted: 'green',
  declined: 'red',
  cancelled: 'gray',
};

const formatDateTime = iso =>
  new Date(iso).toLocaleString('en-BD', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

const ProposalCard = ({ proposal, role, busy, onAccept, onDecline, onCancel }) => {
  const counterparty = role === 'received' ? proposal.requester : proposal.provider;

  return (
    <article className="surface-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-slate-950">{proposal.listingTitle}</h3>
            <Badge color={STATUS_COLORS[proposal.status]}>
              {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-steel-600">
            {role === 'received' ? 'Requested by' : 'Provider'}:{' '}
            <span className="font-medium text-steel-800">{counterparty?.name || 'Unknown'}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-navy-900">{formatCurrency(proposal.finalPriceBDT)}</p>
          {proposal.creditsRedeemed > 0 && (
            <p className="text-xs text-steel-500">
              <span className="line-through">{formatCurrency(proposal.priceAtProposal)}</span>{' '}
              −{formatCurrency(proposal.discountBDT)} ({proposal.creditsRedeemed} credit
              {proposal.creditsRedeemed !== 1 ? 's' : ''})
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-1 text-sm text-steel-600 sm:grid-cols-2">
        <p>Proposed session: {formatDateTime(proposal.proposedSessionAt)}</p>
        <p>Sent {formatDate(proposal.createdAt)}</p>
      </div>

      {proposal.message && (
        <p className="mt-2 rounded-md bg-concrete-50 p-3 text-sm text-steel-700">"{proposal.message}"</p>
      )}

      {proposal.status === 'accepted' && (
        <div className="mt-3 rounded-md border border-concrete-200 bg-concrete-50 p-3 text-sm">
          {proposal.session?.calendarSynced ? (
            <>
              <span className="font-semibold text-emerald-700">Calendar invite sent.</span>{' '}
              {proposal.session.calendarEventLink && (
                <a
                  href={proposal.session.calendarEventLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-navy-800 underline"
                >
                  View calendar event
                </a>
              )}
            </>
          ) : (
            <span className="text-steel-600">
              Trade accepted, but the calendar invite couldn't be sent automatically
              {proposal.session?.calendarError ? ` (${proposal.session.calendarError})` : ''}.
            </span>
          )}
        </div>
      )}

      {proposal.status === 'pending' && (
        <div className="mt-4 flex flex-wrap gap-2">
          {role === 'received' ? (
            <>
              <Button size="sm" disabled={busy} onClick={onAccept}>
                {busy ? 'Working…' : 'Accept'}
              </Button>
              <Button size="sm" variant="danger" disabled={busy} onClick={onDecline}>
                Decline
              </Button>
            </>
          ) : (
            <Button size="sm" variant="ghost" disabled={busy} onClick={onCancel}>
              {busy ? 'Working…' : 'Cancel Proposal'}
            </Button>
          )}
        </div>
      )}
    </article>
  );
};

const Requests = () => {
  const [tab, setTab] = useState('received');
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const loadAll = () => {
    setLoading(true);
    Promise.all([api.get('/trade-proposals/received'), api.get('/trade-proposals/sent')])
      .then(([receivedRes, sentRes]) => {
        setReceived(receivedRes.data.data);
        setSent(sentRes.data.data);
      })
      .catch(() => {
        setReceived([]);
        setSent([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAll();
  }, []);

  const act = async (id, action) => {
    setError('');
    setBusyId(id);
    try {
      if (action === 'cancel') {
        await api.delete(`/trade-proposals/${id}`);
      } else {
        await api.patch(`/trade-proposals/${id}/${action}`);
      }
      loadAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  const list = tab === 'received' ? received : sent;
  const pendingReceivedCount = received.filter(p => p.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div>
        <span className="eyebrow mb-2">Trade Proposal Builder</span>
        <h1 className="text-3xl font-semibold text-slate-950">Requests</h1>
        <p className="mt-2 text-sm text-steel-600">
          Trade proposals lock in the live valuation-engine price at the moment they're sent. Once a
          provider accepts, both people get a shared calendar invite for the session.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab('received')}
          className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
            tab === 'received' ? 'bg-navy-800 text-white' : 'bg-white text-steel-700 border border-concrete-200'
          }`}
        >
          Received{pendingReceivedCount > 0 ? ` (${pendingReceivedCount})` : ''}
        </button>
        <button
          type="button"
          onClick={() => setTab('sent')}
          className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
            tab === 'sent' ? 'bg-navy-800 text-white' : 'bg-white text-steel-700 border border-concrete-200'
          }`}
        >
          Sent
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-16 text-sm text-steel-600">Loading requests…</div>
      ) : list.length === 0 ? (
        <div className="rounded-lg border border-concrete-200 bg-concrete-50 py-16 text-center">
          <p className="text-base font-semibold text-slate-950">
            {tab === 'received' ? 'No trade proposals received yet' : "You haven't proposed any trades yet"}
          </p>
          <p className="mt-2 text-sm text-steel-600">
            {tab === 'received'
              ? 'Proposals on your skill listings will show up here.'
              : 'Browse skills and propose a trade to get started.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map(proposal => (
            <ProposalCard
              key={proposal._id}
              proposal={proposal}
              role={tab}
              busy={busyId === proposal._id}
              onAccept={() => act(proposal._id, 'accept')}
              onDecline={() => act(proposal._id, 'decline')}
              onCancel={() => act(proposal._id, 'cancel')}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Requests;
