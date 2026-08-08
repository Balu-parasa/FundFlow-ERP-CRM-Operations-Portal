import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  padding?: string;
}

export default function GlassCard({
  children,
  className = '',
  interactive = false,
  padding = 'p-6',
}: GlassCardProps) {
  return (
    <div
      className={`glass-card ${interactive ? 'glass-card-interactive cursor-pointer' : ''} ${padding} ${className}`}
    >
      {children}
    </div>
  );
}
