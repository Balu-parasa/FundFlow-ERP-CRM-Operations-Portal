import React from 'react';

interface LoadingStateProps {
  rows?: number;
  type?: 'table' | 'cards' | 'detail';
}

export default function LoadingState({ rows = 5, type = 'table' }: LoadingStateProps) {
  if (type === 'cards') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card p-6">
            <div className="skeleton w-10 h-10 rounded-xl mb-4" />
            <div className="skeleton h-7 w-20 mb-2" />
            <div className="skeleton h-3 w-28" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'detail') {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-4 w-72" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card p-6 space-y-3">
              <div className="skeleton h-3 w-20" />
              <div className="skeleton h-5 w-40" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-0 overflow-hidden">
      {/* Header row */}
      <div className="flex gap-4 p-4 border-b border-border-base">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-3 flex-1" />
        ))}
      </div>
      {/* Body rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex gap-4 p-4 border-b border-border-subtle last:border-b-0"
        >
          {Array.from({ length: 5 }).map((_, j) => (
            <div key={j} className="skeleton h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
