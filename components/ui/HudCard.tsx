'use client';

import { ReactNode } from 'react';
import clsx from 'clsx';

interface Props {
  children: ReactNode;
  accent?: 'cyan' | 'violet' | 'gold' | 'red';
  className?: string;
}

export default function HudCard({ children, accent = 'cyan', className }: Props) {
  const accentClass = accent === 'violet' ? 'v' : accent === 'gold' ? 'g' : accent === 'red' ? 'r' : '';
  return <div className={clsx('hud', accentClass, className)}>{children}</div>;
}
