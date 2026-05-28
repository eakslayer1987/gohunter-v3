/**
 * Match availability helpers — gates ContractCard / DEPLOY NOW behind
 * the time-of-day window declared on each Match (`data/locations.ts`).
 *
 * Window formats recognised:
 *  - "HH:MM — HH:MM"  e.g. "12:00 — 12:30" (FLASH_LUNCH)
 *  - "24H WEEKEND"    Saturday + Sunday all day (RAID_OPEN)
 *  - anything else    permissive — treated as always open
 *
 * The em-dash (—) is the source separator; we also tolerate the
 * ASCII hyphen "-" in case future data lands with a typo.
 */

export interface MatchWindowStatus {
  open: boolean;
  /** Short label for the contract card pill — "OPEN NOW" / "OPENS @ 12:00"
   *  / "WEEKEND ONLY" / "CLOSED". */
  label: string;
}

const HHMM_RANGE = /(\d{1,2}):(\d{2})\s*[—-]\s*(\d{1,2}):(\d{2})/;

export function matchWindowStatus(
  window: string,
  now: Date = new Date(),
): MatchWindowStatus {
  if (/weekend/i.test(window)) {
    const day = now.getDay(); // 0 = Sun, 6 = Sat
    const open = day === 0 || day === 6;
    return { open, label: open ? 'OPEN' : 'WEEKEND ONLY' };
  }

  const m = window.match(HHMM_RANGE);
  if (!m) {
    // Unknown format — be permissive so a typo in seed data doesn't
    // accidentally hide all contracts.
    return { open: true, label: 'OPEN' };
  }

  const startH = parseInt(m[1], 10);
  const startM = parseInt(m[2], 10);
  const endH = parseInt(m[3], 10);
  const endM = parseInt(m[4], 10);

  const nowMin = now.getHours() * 60 + now.getMinutes();
  const startMin = startH * 60 + startM;
  const endMin = endH * 60 + endM;

  const open = nowMin >= startMin && nowMin < endMin;
  if (open) return { open: true, label: 'OPEN NOW' };

  const startLabel = `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`;
  // Before window today → "OPENS @ HH:MM"; after window → tomorrow's
  // open, same label still helps because the player knows when to return.
  return { open: false, label: `OPENS @ ${startLabel}` };
}
