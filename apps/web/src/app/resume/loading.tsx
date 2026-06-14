export default function ResumeLoading() {
  return (
    <div className="max-w-6xl mx-auto terminal-card rounded-2xl shadow-xl border border-primary/10 font-mono overflow-hidden">
      {/* Title Bar Skeleton */}
      <div className="bg-primary/5 border-b border-primary/20 px-4 py-2.5 flex items-center select-none">
        <div className="flex items-center gap-1.5 opacity-50">
          <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
        </div>
      </div>

      <div className="p-8 animate-pulse">
        {/* Hero Section Skeleton */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center border-b border-primary/20 pb-8 mb-8">
        <div className="md:col-span-1 flex justify-center md:justify-start">
          {/* Avatar Skeleton */}
          <div className="w-[200px] h-[200px] rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center">
            <div className="w-[180px] h-[180px] rounded-full bg-primary/10"></div>
          </div>
        </div>
        <div className="md:col-span-2 text-center md:text-left space-y-4">
          <div className="h-10 w-64 bg-primary/10 rounded mx-auto md:mx-0"></div>
          <div className="flex justify-center md:justify-start gap-3 flex-wrap">
            <div className="h-6 w-48 bg-primary/5 border border-primary/10 rounded"></div>
            <div className="h-6 w-32 bg-primary/5 border border-primary/10 rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full bg-primary/10 rounded"></div>
            <div className="h-4 w-5/6 bg-primary/10 rounded"></div>
          </div>
          <div className="h-8 w-48 bg-primary/10 rounded mx-auto md:mx-0"></div>
        </div>
      </section>

      {/* Two-column Layout on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8 items-start">
        {/* Main Column Skeleton */}
        <div className="lg:col-span-2 space-y-8">
          <div className="border border-primary/10 rounded-xl p-6 space-y-6">
            <div className="h-8 w-60 bg-primary/10 rounded"></div>
            
            {/* Experience Item Skeletons */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-l-2 border-primary/10 pl-6 space-y-3 relative">
                <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-primary/30"></div>
                <div className="h-5 w-48 bg-primary/10 rounded"></div>
                <div className="h-4 w-36 bg-primary/5 rounded"></div>
                <div className="space-y-2">
                  <div className="h-3.5 w-full bg-primary/5 rounded"></div>
                  <div className="h-3.5 w-5/6 bg-primary/5 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Column Skeleton */}
        <div className="lg:col-span-1 space-y-8">
          <div className="border border-primary/10 rounded-xl p-6 space-y-6">
            <div className="h-6 w-24 bg-primary/10 rounded"></div>
            
            {/* Skill Group Skeletons */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <div className="h-4 w-32 bg-primary/10 rounded"></div>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="h-6 w-16 bg-primary/5 border border-primary/10 rounded"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
