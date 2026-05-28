'use client';

import { useEffect, useState } from 'react';
import { matchWindowStatus, type MatchWindowStatus } from '@/lib/match-window';

/** Re-evaluates the window status every minute. Defers the first real
 *  evaluation to `useEffect` so SSR and the initial client render both
 *  paint "OPEN" — avoids hydration mismatch when the server clock
 *  disagrees with the client clock about whether FLASH_LUNCH is live. */
export function useMatchWindowStatus(windowSpec: string): MatchWindowStatus {
  const [status, setStatus] = useState<MatchWindowStatus>({
    open: true,
    label: 'OPEN',
  });

  useEffect(() => {
    const update = () => setStatus(matchWindowStatus(windowSpec));
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [windowSpec]);

  return status;
}
