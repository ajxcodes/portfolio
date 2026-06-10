export default function BlogLoading() {
  return (
    <div className="max-w-4xl mx-auto mt-4 font-mono animate-pulse">
      {/* Blog Terminal Console Card Skeleton */}
      <div className="w-full terminal-card p-8 md:p-12 rounded-xl shadow-xl relative overflow-hidden pt-14 mb-12 border border-primary/10">
        {/* Terminal Title Bar */}
        <div className="absolute top-0 left-0 right-0 bg-primary/5 border-b border-primary/20 px-4 py-2.5 flex items-center gap-1.5 select-none">
          <div className="w-3 h-3 rounded-full bg-primary/20"></div>
          <div className="w-3 h-3 rounded-full bg-primary/20"></div>
          <div className="w-3 h-3 rounded-full bg-primary/20"></div>
          <span className="text-xs font-mono text-primary/40 ml-2">bash - loading...</span>
        </div>

        <header className="mb-10 text-center sm:text-left space-y-3">
          <div className="h-8 w-48 bg-primary/10 rounded mx-auto sm:mx-0"></div>
          <div className="h-4 w-96 bg-primary/5 rounded mx-auto sm:mx-0"></div>
        </header>

        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <article key={i} className="border border-primary/10 bg-primary/5/10 p-6 rounded-md space-y-4">
              <div className="h-6 w-3/4 bg-primary/10 rounded"></div>
              <div className="space-y-2">
                <div className="h-4 w-full bg-primary/5 rounded"></div>
                <div className="h-4 w-5/6 bg-primary/5 rounded"></div>
              </div>
              <div className="flex justify-end">
                <div className="h-8 w-24 bg-primary/10 rounded"></div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
