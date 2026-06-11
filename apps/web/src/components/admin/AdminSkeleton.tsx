import React from 'react';

export const AdminSkeleton = () => {
  return (
    <div className="space-y-8 font-mono animate-pulse w-full">
      {/* Header Skeleton */}
      <div className="flex items-center gap-4 border-b border-primary/10 pb-6">
        <div className="w-10 h-10 bg-primary/10 rounded"></div>
        <div>
          <div className="h-8 w-48 bg-primary/15 rounded mb-2"></div>
          <div className="h-4 w-96 bg-primary/5 rounded max-w-full"></div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Top Cards Skeleton (Adapts well to 3 cards or empty) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="terminal-card p-6 rounded-xl flex items-center gap-4 border border-primary/10">
              <div className="w-12 h-12 bg-primary/15 rounded flex-shrink-0"></div>
              <div className="space-y-2 flex-1">
                <div className="h-3 w-20 bg-primary/5 rounded"></div>
                <div className="h-6 w-16 bg-primary/10 rounded"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Content Area Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 terminal-card p-6 rounded-xl space-y-4 min-h-[400px] border border-primary/10">
            <div className="h-5 w-48 bg-primary/10 rounded mb-6"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6].map((j) => (
                <div key={j} className="flex gap-4">
                  <div className="h-10 w-1/4 bg-primary/5 rounded"></div>
                  <div className="h-10 w-1/2 bg-primary/5 rounded"></div>
                  <div className="h-10 w-1/4 bg-primary/5 rounded"></div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="lg:col-span-1 terminal-card p-6 rounded-xl space-y-4 min-h-[400px] border border-primary/10">
            <div className="h-5 w-32 bg-primary/10 rounded mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 w-full bg-primary/5 rounded"></div>
              <div className="h-4 w-3/4 bg-primary/5 rounded"></div>
              <div className="h-20 w-full bg-primary/10 rounded mt-8"></div>
              <div className="h-20 w-full bg-primary/10 rounded mt-4"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
