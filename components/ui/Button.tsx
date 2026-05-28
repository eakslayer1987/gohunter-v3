'use client';

import { ButtonHTMLAttributes, MouseEvent, ReactNode } from 'react';
import clsx from 'clsx';
import { playClick, playFire } from '@/lib/sound';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'red';
  children: ReactNode;
}

export default function Button({
  variant = 'primary',
  children,
  className,
  onClick,
  ...rest
}: Props) {
  const cls =
    variant === 'ghost' ? 'btn-ghost' : variant === 'red' ? 'btn-red' : 'btn-cyber';
  // Click SFX layered before the user's onClick — red variant uses
  // the heavier FIRE timbre so LOCK_TARGET feels weightier than a
  // routine button press.
  const handle = (e: MouseEvent<HTMLButtonElement>) => {
    if (rest.disabled) return;
    if (variant === 'red') playFire();
    else playClick();
    onClick?.(e);
  };
  return (
    <button className={clsx(cls, className)} onClick={handle} {...rest}>
      {children}
    </button>
  );
}
