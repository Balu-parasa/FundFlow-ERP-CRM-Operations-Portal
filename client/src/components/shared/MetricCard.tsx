import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  subtitle?: string;
  accentColor?: string;
  delay?: number;
}

export default function MetricCard({
  icon: Icon,
  value,
  label,
  subtitle,
  accentColor = 'rgba(74, 23, 37, 0.1)',
  delay = 0,
}: MetricCardProps) {
  return (
    <div
      className="metric-card"
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: accentColor }}
        >
          <Icon className="w-5 h-5" style={{ color: accentColor.replace('0.1', '1') }} />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-text-primary tracking-tight">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        <p className="text-xs font-medium text-text-muted mt-1 uppercase tracking-wider">
          {label}
        </p>
        {subtitle && (
          <p className="text-[11px] text-text-muted mt-2">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
