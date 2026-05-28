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
  const [srcA, setSrcA] = useState(() =>
    buildSVUrl(apiKey, initialLat, initialLng, initialHeading),
  );
  const [srcB, setSrcB] = useState('');
  const [isStepping, setIsStepping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pendingSwapRef = useRef<(() => void) | null>(null);

  // Notify parent of initial position once.
  useEffect(() => {
    onPositionChange?.(initialLat, initialLng, initialHeading);
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

  function loadIntoInactive(lat: number, lng: number, hdg: number) {
    const url = buildSVUrl(apiKey, lat, lng, hdg);
    setIsStepping(true);
    setError(null);

    const inactive = activeIframe === 0 ? 1 : 0;
    if (inactive === 0) setSrcA(url);
    else setSrcB(url);

    // Watchdog — if the inactive iframe doesn't fire onLoad within 5s
    // (rare; cached or unreachable), force the swap anyway so the
    // player isn't stuck.
    const timeout = window.setTimeout(() => {
      pendingSwapRef.current = null;
      commitSwap(lat, lng, hdg);
    }, 5000);

    pendingSwapRef.current = () => {
      window.clearTimeout(timeout);
      pendingSwapRef.current = null;
      commitSwap(lat, lng, hdg);
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

function buildSVUrl(
  key: string | undefined,
  lat: number,
  lng: number,
  heading: number,
): string {
  if (!key) return 'about:blank';
  const params = new URLSearchParams({
    key,
    location: `${lat},${lng}`,
    heading: heading.toString(),
    pitch: '0',
    fov: '90',
  });
  return `https://www.google.com/maps/embed/v1/streetview?${params.toString()}`;
}
