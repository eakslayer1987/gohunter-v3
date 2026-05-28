'use client';

import { useEffect, useRef } from 'react';
import clsx from 'clsx';
import { useToastStore } from '@/store/toastStore';
import { playToastError, playToastInfo, playToastSuccess } from '@/lib/sound';

const variantClass: Record<string, string> = {
  error: 'border-cyber-red/60 text-cyber-red',
  warn: 'border-cyber-gold/60 text-cyber-gold',
  success: 'border-cyber-green/60 text-cyber-green',
  info: 'border-cyber-cyan/60 text-cyber-cyan',
};

export default function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismissToast);

  // Play a SFX for each newly-pushed toast (not re-renders of the
  // same list). We track the highest toast id we've already SFX'd
  // so reordering / dismiss doesn't re-fire.
  const lastSeenIdRef = useRef(0);
  useEffect(() => {
    for (const t of toasts) {
      if (t.id <= lastSeenIdRef.current) continue;
      lastSeenIdRef.current = t.id;
      if (t.variant === 'error') playToastError();
      else if (t.variant === 'success') playToastSuccess();
      else playToastInfo();
    }
  }, [toasts]);
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none">
      {toasts.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => dismiss(t.id)}
          className={clsx(
            'pointer-events-auto cursor-pointer px-5 py-3 bg-base-deep/95 border font-mono text-[11px] uppercase tracking-cyber backdrop-blur-md',
            variantClass[t.variant] ?? variantClass.info,
          )}
          style={{
            clipPath: 'polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)',
            boxShadow: '0 0 24px rgba(0,0,0,0.6), 0 0 12px currentColor',
            animation: 'toast-pop 0.18s ease-out',
          }}
        >
          {t.message}
        </button>
      ))}
      <style jsx global>{`
        @keyframes toast-pop {
          from { transform: translateY(8px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
