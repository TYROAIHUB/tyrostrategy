export default function CardSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="px-4 py-4 animate-pulse">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-tyro-border/30 rounded-lg w-3/4" />
              <div className="h-3 bg-tyro-border/20 rounded-lg w-1/2" />
            </div>
            <div className="h-5 w-16 bg-tyro-border/20 rounded-full" />
          </div>
          <div className="flex items-center gap-2 mt-3">
            <div className="flex-1 h-1.5 bg-tyro-border/20 rounded-full" />
            <div className="h-3 w-8 bg-tyro-border/20 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
