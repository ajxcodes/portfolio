export default function RootLoading() {
  return (
    <div className="max-w-6xl mx-auto flex flex-col items-center mt-4 px-4 font-mono animate-pulse">
      {/* Bio Terminal Console Card Skeleton */}
      <div className="w-full terminal-card p-8 md:p-12 rounded-xl shadow-xl flex flex-col items-center text-center mb-8 relative overflow-hidden pt-14 border border-primary/10">
        {/* Terminal Title Bar */}
        <div className="absolute top-0 left-0 right-0 bg-primary/5 border-b border-primary/20 px-4 py-2.5 flex items-center gap-1.5 select-none">
          <div className="w-3 h-3 rounded-full bg-primary/20"></div>
          <div className="w-3 h-3 rounded-full bg-primary/20"></div>
          <div className="w-3 h-3 rounded-full bg-primary/20"></div>
          <span className="text-xs font-mono text-primary/40 ml-2">bash - loading...</span>
        </div>

        <div className="mb-8 mt-2">
          {/* Avatar Skeleton */}
          <div className="w-[200px] h-[200px] rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center">
            <div className="w-[180px] h-[180px] rounded-full bg-primary/10"></div>
          </div>
        </div>

        {/* Title & Headline skeletons */}
        <div className="h-8 w-64 bg-primary/10 rounded mb-4"></div>
        <div className="h-6 w-48 bg-primary/5 border border-primary/10 rounded mb-6"></div>
        <div className="space-y-2 w-full max-w-2xl flex flex-col items-center">
          <div className="h-4 w-full bg-primary/10 rounded"></div>
          <div className="h-4 w-5/6 bg-primary/10 rounded"></div>
        </div>
      </div>

      {/* Two Column Layout Skeleton */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Left Column (2/3): Terminal Shell Skeleton */}
        <div className="lg:col-span-2">
          <div className="terminal-card w-full h-[400px] rounded-xl border border-primary/10 p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="h-4 w-1/3 bg-primary/10 rounded"></div>
              <div className="h-4 w-1/2 bg-primary/5 rounded"></div>
              <div className="h-4 w-2/3 bg-primary/10 rounded"></div>
            </div>
            <div className="h-8 w-24 bg-primary/10 rounded"></div>
          </div>
        </div>

        {/* Right Column (1/3): Latest Posts Skeleton */}
        <div className="lg:col-span-1 space-y-4">
          <div className="h-6 w-36 bg-primary/10 rounded mb-6"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 terminal-card rounded-md border border-primary/10 space-y-3">
              <div className="h-4 w-3/4 bg-primary/10 rounded"></div>
              <div className="h-3 w-full bg-primary/5 rounded"></div>
              <div className="h-3 w-5/6 bg-primary/5 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
