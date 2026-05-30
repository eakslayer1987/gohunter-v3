'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ROTATE_STEP_DEG,
  STEP_DISTANCE_M,
  cardinalForHeading,
  normalizeHeading,
  walkFrom,
} from '@/lib/walker-math';
import styles from './StreetViewWalker.module.css';

interface StreetViewWalkerProps {
  initialLat: number;
  initialLng: number;
  initialHeading?: number;
  onPositionChange?: (lat: number, lng: number, heading: number) => void;
  onWalkStep?: () => void;
}

type StepDir = 'forward' | 'back' | 'left' | 'right';
type RotateDir = 'ccw' | 'cw';

/**
 * Google Street View Embed wrapper that lets the player "walk" by us
 * recomputing lat/lng via haversine on each tap and reloading the
 * iframe at the new position.
 *
 * Two iframes are stacked and cross-faded (300ms) to hide the white
 * flash of `src` change. Each step also triggers a CSS scale+blur
 * "push-forward" animation, a footstep sound (best-effort, fails
 * silently on autoplay restrictions), and a haptic vibrate on mobile.
 *
 * Cross-origin sealed: we cannot read where the player navigates
 * inside the iframe itself — only the position WE set is canonical.
 * Google's native pano arrows remain visible inside the embed but
 * our state only tracks the lat/lng OUR buttons set.
 *
 * Ported from gohunter-v2 components/hunts/StreetViewWalker.tsx.
 */
export function StreetViewWalker({
  initialLat,
  initialLng,
  initialHeading = 0,
  onPositionChange,
  onWalkStep,
}: StreetViewWalkerProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const [pos, setPos] = useState({ lat: initialLat, lng: initialLng });
  const [heading, setHeading] = useState(initialHeading);
  const [activeIframe, setActiveIframe] = useState<0 | 1>(0);
  // Initial srcA empty — the useEffect below resolves the nearest
  // outdoor pano via the metadata API and sets it. Prevents the
  // first frame from being an indoor business pano.
  const [srcA, setSrcA] = useState('');
  const [srcB, setSrcB] = useState('');
  const [isStepping, setIsStepping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pendingSwapRef = useRef<(() => void) | null>(null);

  // Snap initial position to the nearest outdoor Street View pano.
  // Embed API ignores source=outdoor so we have to look up the pano
  // ourselves via the (free) metadata endpoint and embed by pano_id.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const url = await resolveOutdoorSVUrl(
        apiKey,
        initialLat,
        initialLng,
        initialHeading,
      );
      if (cancelled) return;
      setSrcA(url.embedUrl);
      if (url.snappedLat != null && url.snappedLng != null) {
        setPos({ lat: url.snappedLat, lng: url.snappedLng });
        onPositionChange?.(url.snappedLat, url.snappedLng, initialHeading);
      } else {
        onPositionChange?.(initialLat, initialLng, initialHeading);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const step = useCallback(
    (dir: StepDir) => {
      if (isStepping) return;
      const bearing =
        dir === 'forward'
          ? heading
          : dir === 'back'
          ? heading + 180
          : dir === 'left'
          ? heading - 90
          : heading + 90;
      const next = walkFrom(pos.lat, pos.lng, bearing, STEP_DISTANCE_M);
      void loadIntoInactive(next.lat, next.lng, heading);
      onWalkStep?.();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pos.lat, pos.lng, heading, isStepping, onWalkStep],
  );

  const rotate = useCallback(
    (dir: RotateDir) => {
      if (isStepping) return;
      const next = normalizeHeading(
        heading + (dir === 'cw' ? ROTATE_STEP_DEG : -ROTATE_STEP_DEG),
      );
      void loadIntoInactive(pos.lat, pos.lng, next);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pos.lat, pos.lng, heading, isStepping],
  );

  async function loadIntoInactive(lat: number, lng: number, hdg: number) {
    setIsStepping(true);
    setError(null);

    // Resolve to the nearest outdoor pano. Stays on roads as the
    // player walks; if they happen to step into a building footprint
    // the metadata API snaps back to the closest road-side pano.
    const resolved = await resolveOutdoorSVUrl(apiKey, lat, lng, hdg);
    const finalLat = resolved.snappedLat ?? lat;
    const finalLng = resolved.snappedLng ?? lng;

    const inactive = activeIframe === 0 ? 1 : 0;
    if (inactive === 0) setSrcA(resolved.embedUrl);
    else setSrcB(resolved.embedUrl);

    // Watchdog — if the inactive iframe doesn't fire onLoad within 5s
    // (rare; cached or unreachable), force the swap anyway so the
    // player isn't stuck.
    const timeout = window.setTimeout(() => {
      pendingSwapRef.current = null;
      commitSwap(finalLat, finalLng, hdg);
    }, 5000);

    pendingSwapRef.current = () => {
      window.clearTimeout(timeout);
      pendingSwapRef.current = null;
      commitSwap(finalLat, finalLng, hdg);
    };
  }

  function commitSwap(lat: number, lng: number, hdg: number) {
    setActiveIframe((prev) => (prev === 0 ? 1 : 0));
    setPos({ lat, lng });
    setHeading(hdg);
    onPositionChange?.(lat, lng, hdg);

    try {
      audioRef.current?.play().catch(() => {
        /* autoplay blocked — silent fallback */
      });
    } catch {
      /* noop */
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(30);
    }

    window.setTimeout(() => setIsStepping(false), 360);
  }

  const onIframeLoad = (slot: 0 | 1) => () => {
    if (slot !== activeIframe && pendingSwapRef.current) {
      pendingSwapRef.current();
    }
  };

  if (!apiKey) {
    return (
      <div className={styles.error}>
        ⚠ ขาด <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>
        <br />
        ใส่ใน <code>.env.local</code> แล้ว restart dev server
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.viewport}>
        <iframe
          key="sv-a"
          src={srcA}
          className={`${styles.iframe} ${
            activeIframe === 0 ? styles.iframeActive : styles.iframeInactive
          } ${isStepping && activeIframe === 0 ? styles.iframeStepping : ''}`}
          loading="eager"
          referrerPolicy="no-referrer-when-downgrade"
          allow="accelerometer; gyroscope"
          onLoad={onIframeLoad(0)}
          title="Street View pane A"
        />
        {srcB && (
          <iframe
            key="sv-b"
            src={srcB}
            className={`${styles.iframe} ${
              activeIframe === 1 ? styles.iframeActive : styles.iframeInactive
            } ${
              isStepping && activeIframe === 1 ? styles.iframeStepping : ''
            }`}
            loading="eager"
            referrerPolicy="no-referrer-when-downgrade"
            allow="accelerometer; gyroscope"
            onLoad={onIframeLoad(1)}
            title="Street View pane B"
          />
        )}

        {/* Horizontal compass strip — per design system spec, replaces
            the old circular dial. Cardinal letter in the middle flips
            as the player rotates; flanking ticks decorate the bezel. */}
        <div className={styles.compassStrip} aria-hidden>
          <span className={styles.tick} />
          <span className={styles.tick} />
          <span className={styles.tick} />
          <span className={styles.tickMajor}>
            <span className={styles.compassCaret}>▼</span> {cardinalForHeading(heading)}
          </span>
          <span className={styles.tick} />
          <span className={styles.tick} />
          <span className={styles.tick} />
        </div>

        <div className={styles.coordChip} aria-live="polite">
          📍 {pos.lat.toFixed(5)}, {pos.lng.toFixed(5)}
        </div>

        {error && <div className={styles.errorBanner}>{error}</div>}
      </div>

      <div className={styles.controls}>
        <div className={styles.row}>
          <span className={styles.rowLabel}>WALK</span>
          <button
            type="button"
            className={styles.btn}
            onClick={() => step('forward')}
            disabled={isStepping}
          >
            ⬆ FWD {STEP_DISTANCE_M}M
          </button>
          <button
            type="button"
            className={styles.btn}
            onClick={() => step('back')}
            disabled={isStepping}
          >
            ⬇ BACK
          </button>
          <button
            type="button"
            className={styles.btn}
            onClick={() => step('left')}
            disabled={isStepping}
          >
            ⬅ LEFT
          </button>
          <button
            type="button"
            className={styles.btn}
            onClick={() => step('right')}
            disabled={isStepping}
          >
            ➡ RIGHT
          </button>
        </div>
        <div className={styles.row}>
          <span className={styles.rowLabel}>TURN</span>
          <button
            type="button"
            className={styles.btn}
            onClick={() => rotate('ccw')}
            disabled={isStepping}
          >
            ↺ −{ROTATE_STEP_DEG}°
          </button>
          <button
            type="button"
            className={styles.btn}
            onClick={() => rotate('cw')}
            disabled={isStepping}
          >
            ↻ +{ROTATE_STEP_DEG}°
          </button>
        </div>
      </div>

      {/* Footstep sound — best effort. Placeholder src; will fail
          silently until /audio/footstep.mp3 lands. */}
      <audio ref={audioRef} preload="none" src="/audio/footstep.mp3" />
    </div>
  );
}

interface ResolvedSVUrl {
  embedUrl: string;
  /** Snapped pano coords from metadata, if found. Null when we
   *  fell back to plain location embed (no outdoor pano nearby). */
  snappedLat: number | null;
  snappedLng: number | null;
}

/**
 * Resolve target coords to the nearest OUTDOOR Street View pano
 * via the metadata API (free, no usage cost). Returns an embed URL
 * that uses pano=ID so the panorama Google serves is the one we
 * picked, not an indoor business pano nearby.
 *
 * Fallback path (rare — metadata returns ZERO_RESULTS for the
 * radius): falls back to plain location embed. Indoor pano risk
 * returns but at least the iframe still renders something.
 */
async function resolveOutdoorSVUrl(
  key: string | undefined,
  lat: number,
  lng: number,
  heading: number,
): Promise<ResolvedSVUrl> {
  if (!key) {
    return { embedUrl: 'about:blank', snappedLat: null, snappedLng: null };
  }

  try {
    const metaParams = new URLSearchParams({
      location: `${lat},${lng}`,
      // source=outdoor is honoured by the metadata API even though
      // the embed API ignores it — that's the whole reason we route
      // through metadata first.
      source: 'outdoor',
      radius: '300',
      key,
    });
    const metaRes = await fetch(
      `https://maps.googleapis.com/maps/api/streetview/metadata?${metaParams.toString()}`,
    );
    const meta = (await metaRes.json()) as {
      status?: string;
      pano_id?: string;
      location?: { lat: number; lng: number };
    };
    if (meta.status === 'OK' && meta.pano_id) {
      const params = new URLSearchParams({
        key,
        pano: meta.pano_id,
        heading: heading.toString(),
        pitch: '0',
        fov: '90',
      });
      return {
        embedUrl: `https://www.google.com/maps/embed/v1/streetview?${params.toString()}`,
        snappedLat: meta.location?.lat ?? null,
        snappedLng: meta.location?.lng ?? null,
      };
    }
  } catch {
    /* network / CORS issue — fall through to plain embed */
  }

  // Fallback: location-based embed (may pick indoor pano if that's
  // the closest match Google has).
  const params = new URLSearchParams({
    key,
    location: `${lat},${lng}`,
    heading: heading.toString(),
    pitch: '0',
    fov: '90',
  });
  return {
    embedUrl: `https://www.google.com/maps/embed/v1/streetview?${params.toString()}`,
    snappedLat: null,
    snappedLng: null,
  };
}
