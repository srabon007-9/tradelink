/**
 * components/ui/Skeleton.jsx — Animated Skeleton Loading Loader
 */

export const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse rounded-md bg-concrete-200 ${className}`} />
);

export const CardSkeleton = () => (
  <div className="surface-card flex flex-col p-5 space-y-4 animate-pulse">
    <div className="flex justify-between items-center">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-6 w-20" />
    </div>
    <Skeleton className="h-6 w-3/4" />
    <Skeleton className="h-12 w-full" />
    <div className="flex items-center gap-3 pt-3 border-t border-concrete-200">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="space-y-1 flex-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
    <Skeleton className="h-10 w-full rounded-md" />
  </div>
);

export default Skeleton;
