/**
 * pages/Messages/index.jsx — Member Messages
 */

import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

const Messages = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="eyebrow mb-2">Communication</span>
          <h1 className="text-3xl font-semibold text-slate-950">Messages</h1>
          <p className="mt-2 text-sm text-steel-600">
            Direct messages and trade discussion threads with other members.
          </p>
        </div>
        <Badge color="gray">Coming Soon</Badge>
      </div>

      <Card className="p-12 text-center">
        <p className="text-base font-semibold text-slate-950">No Active Conversations</p>
        <p className="mt-2 text-sm text-steel-600 max-w-md mx-auto">
          Direct messaging between skill providers and requesters will be activated when a trade proposal is accepted.
        </p>
      </Card>
    </div>
  );
};

export default Messages;
