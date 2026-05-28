'use client';

import { ReactNode } from 'react';
import clsx from 'clsx';

interface Props {
  children: ReactNode;
  variant?: 'default' | 'cyan' | 'violet' | 'gold' | 'red' | 'green';
  className?: string;
}

export default function Pill({ children, variant = 'default', className }: Props) {
  const variantClass =
    variant === 'cyan'
      ? 'pill-c'
      : variant === 'violet'
      ? 'pill-v'
      : variant === 'gold'
      ? 'pill-g'
      : variant === 'red'
      ? 'pill-r'
      : variant === 'green'
      ? 'pill-gr'
      : '';
  return <span className={clsx('pill', variantClass, className)}>{children}</span>;
}
