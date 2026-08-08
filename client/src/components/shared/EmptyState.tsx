import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  message?: string;
  action?: React.ReactNode;
}

export default function EmptyState({
  icon: Icon = Inbox,
  title,
  message,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-5">
        <Icon className="w-7 h-7 text-text-muted" />
      </div>
      <h3 className="text-sm font-semibold text-text-secondary mb-1">{title}</h3>
      {message && (
        <p className="text-xs text-text-muted max-w-sm">{message}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
