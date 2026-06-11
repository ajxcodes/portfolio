import React from "react";
import { User, Mail, Briefcase } from "lucide-react";

export function ProfileSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 font-mono text-xs animate-pulse">
      {/* Sticky top action bar skeleton */}
      <div className="bg-background/85 py-4 border-b border-primary/10 flex justify-between items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded border border-primary/20 bg-primary/5" />
          <div className="space-y-2">
            <div className="w-48 h-5 bg-primary/10 rounded" />
            <div className="hidden md:block w-72 h-3 bg-primary/5 rounded" />
          </div>
        </div>
        <div className="w-24 h-8 bg-primary/10 rounded" />
      </div>

      <div className="space-y-8">
        {/* Main Details Card */}
        <div className="terminal-card p-8 rounded-xl space-y-6">
          <h2 className="text-sm font-bold text-primary flex items-center gap-2 border-b border-primary/10 pb-3">
            <User className="w-4 h-4 opacity-50" />
            <div className="w-32 h-4 bg-primary/10 rounded" />
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="w-20 h-3 bg-primary/5 rounded" />
              <div className="w-full h-10 bg-primary/5 rounded" />
            </div>
            <div className="space-y-2">
              <div className="w-32 h-3 bg-primary/5 rounded" />
              <div className="w-full h-10 bg-primary/5 rounded" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="w-48 h-3 bg-primary/5 rounded" />
            <div className="w-full h-24 bg-primary/5 rounded" />
          </div>

          <div className="border-t border-primary/10 pt-6 mt-6 space-y-6">
            <div className="w-40 h-4 bg-primary/10 rounded" />

            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 space-y-2 w-full">
                <div className="w-32 h-3 bg-primary/5 rounded" />
                <div className="w-full h-10 bg-primary/5 rounded" />
              </div>
              <div className="w-full sm:w-36 h-10 bg-primary/10 rounded" />
            </div>

            <div className="w-full h-10 bg-primary/10 rounded" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="w-36 h-3 bg-primary/5 rounded" />
                <div className="w-full h-10 bg-primary/5 rounded" />
                <div className="flex items-center gap-2">
                  <div className="w-36 h-8 bg-primary/10 rounded" />
                  <div className="w-8 h-8 rounded-full bg-primary/5" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="w-36 h-3 bg-primary/5 rounded" />
                <div className="w-full h-10 bg-primary/5 rounded" />
                <div className="flex items-center gap-2">
                  <div className="w-36 h-8 bg-primary/10 rounded" />
                  <div className="w-8 h-8 rounded-full bg-primary/5" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Links Card */}
        <div className="terminal-card p-8 rounded-xl space-y-6">
          <h2 className="text-sm font-bold text-primary flex items-center gap-2 border-b border-primary/10 pb-3">
            <Mail className="w-4 h-4 opacity-50" />
            <div className="w-36 h-4 bg-primary/10 rounded" />
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-2">
                <div className="w-32 h-3 bg-primary/5 rounded" />
                <div className="w-full h-10 bg-primary/5 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Work Experiences Card */}
        <div className="terminal-card p-8 rounded-xl space-y-6">
          <div className="flex justify-between items-center border-b border-primary/10 pb-3">
            <h2 className="text-sm font-bold text-primary flex items-center gap-2">
              <Briefcase className="w-4 h-4 opacity-50" />
              <div className="w-32 h-4 bg-primary/10 rounded" />
            </h2>
            <div className="w-24 h-8 bg-primary/10 rounded" />
          </div>

          <div className="space-y-6">
            {[1, 2].map((i) => (
              <div key={i} className="p-5 border border-primary/10 bg-primary/5 rounded-md space-y-4">
                <div className="flex justify-between items-center border-b border-primary/5 pb-3">
                  <div className="w-48 h-4 bg-primary/10 rounded" />
                  <div className="flex gap-2">
                    <div className="w-8 h-8 bg-primary/10 rounded" />
                    <div className="w-8 h-8 bg-primary/10 rounded" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="w-24 h-3 bg-primary/5 rounded" />
                    <div className="w-full h-10 bg-primary/5 rounded" />
                  </div>
                  <div className="space-y-2">
                    <div className="w-24 h-3 bg-primary/5 rounded" />
                    <div className="w-full h-10 bg-primary/5 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
