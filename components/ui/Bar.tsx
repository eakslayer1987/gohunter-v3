'use client';

import clsx from 'clsx';

interface Props {
  value: number;
  max?: number;
  className?: string;
  fillClassName?: string;
  height?: number;
}

export default function Bar({ value, max = 100, className, fillClassName, height = 5 }: Props) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={clsx('bar', className)} style={{ height: `${height}px` }}>
      <div className={clsx('bar-fill', fillClassName)} style={{ width: `${pct}%` }} />
    </div>
  );
}
