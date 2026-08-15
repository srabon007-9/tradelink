/**
 * pages/Reviews/index.jsx — Member Reviews & Ratings
 */

import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

const Reviews = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="eyebrow mb-2">Reputation System</span>
          <h1 className="text-3xl font-semibold text-slate-950">Reviews & Ratings</h1>
          <p className="mt-2 text-sm text-steel-600">
            Ratings and feedback received from completed skill exchanges.
          </p>
        </div>
        <Badge color="gray">Coming Soon</Badge>
      </div>

      <Card className="p-12 text-center">
        <p className="text-base font-semibold text-slate-950">No Reviews Received Yet</p>
        <p className="mt-2 text-sm text-steel-600 max-w-md mx-auto">
          Reviews and 5-star ratings will be unlocked once you complete your first skill exchange trade.
        </p>
      </Card>
    </div>
  );
};

export default Reviews;
