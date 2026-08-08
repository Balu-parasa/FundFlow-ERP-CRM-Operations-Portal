import React from 'react';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusMap: Record<string, string> = {
  DRAFT: 'badge-draft',
  CONFIRMED: 'badge-confirmed',
  CANCELLED: 'badge-cancelled',
  ACTIVE: 'badge-active',
  INACTIVE: 'badge-inactive',
  LEAD: 'badge-lead',
  PROSPECT: 'badge-prospect',
  CUSTOMER: 'badge-customer',
  LOW: 'badge-warning',
  HEALTHY: 'badge-confirmed',
  IN: 'badge-confirmed',
  OUT: 'badge-cancelled',
};

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const badgeClass = statusMap[status?.toUpperCase()] || 'badge-draft';

  return (
    <span className={`badge ${badgeClass} ${className}`}>
      {status}
    </span>
  );
}
