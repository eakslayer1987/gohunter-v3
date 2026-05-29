'use client';

import { useEffect, useRef } from 'react';
import maplibregl, { type Map as MlMap, type Marker } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useGameStore } from '@/store/gameStore';
import { playPinDrop } from '@/lib/sound';

const STYLE_URL = '/assets/style/cyber-purple-style.json';
const DEFAULT_CENTER: [number, number] = [100.5018, 13.7563]; // Bangkok central
const DEFAULT_ZOOM = 11;
const PIN_HINT_RADIUS_M = 500;

/** Approximate a geographic circle as a 64-vertex polygon. Flat-earth
 *  fine at 500m / Bangkok latitudes — only used as a visual hint ring
 *  around the player's pin, not for scoring. */
function circlePolygon(
  lat: number,
  lng: number,
  radiusMeters: number,
  steps = 64,
): GeoJSON.Feature<GeoJSON.Polygon> {
  const coords: [number, number][] = [];
  const R = 6378137;
  const dLat = ((radiusMeters / R) * 180) / Math.PI;
  const dLng = ((radiusMeters / (R * Math.cos((lat * Math.PI) / 180))) * 180) / Math.PI;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * 2 * Math.PI;
    coords.push([lng + dLng * Math.cos(t), lat + dLat * Math.sin(t)]);
  }
  return {
    type: 'Feature',
    properties: {},
    geometry: { type: 'Polygon', coordinates: [coords] },
  };
}

function buildPinElement(): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'cyber-pin';
  el.innerHTML = `
    <svg width="36" height="48" viewBox="0 0 36 48" xmlns="http://www.w3.org/2000/svg">
      <polygon points="18,4 32,18 32,32 18,44 4,32 4,18" fill="#FBBF24" stroke="#fff" stroke-width="2"/>
      <circle cx="18" cy="25" r="6" fill="#0a0612"/>
      <circle cx="18" cy="25" r="3" fill="#FBBF24"/>
    </svg>
  `;
  return el;
}

export default function GameMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MlMap | null>(null);
  const markerRef = useRef<Marker | null>(null);

  // Use refs for store mutators so the click handler is registered once.
  const setPin = useGameStore((s) => s.setPin);
  const dragPin = useGameStore((s) => s.dragPin);
  const handlersRef = useRef({ setPin, dragPin });
  handlersRef.current = { setPin, dragPin };

  // Subscribed slice — re-renders this component on pinPosition change.
  const pinPosition = useGameStore(
    (s) => s.missionsInMatch[s.currentMissionIndex]?.pinPosition,
  );

  // Bootstrap the map exactly once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: false,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');
    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      'bottom-right',
    );

    map.on('load', () => {
      // Hint-ring source + outline layer. Filled in lazily once a pin lands.
      map.addSource('pin-ring', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: 'pin-ring-fill',
        type: 'fill',
        source: 'pin-ring',
        paint: { 'fill-color': '#22D3EE', 'fill-opacity': 0.06 },
      });
      map.addLayer({
        id: 'pin-ring-outline',
        type: 'line',
        source: 'pin-ring',
        paint: {
          'line-color': '#22D3EE',
          'line-width': 1,
          'line-dasharray': [3, 4],
        },
      });
    });

    // Pin click — first tap sets, subsequent taps spend energy via dragPin.
    map.on('click', (e) => {
      const { lat, lng } = e.lngLat;
      const cur = useGameStore.getState().missionsInMatch[
        useGameStore.getState().currentMissionIndex
      ];
      if (cur?.pinPosition) {
        handlersRef.current.dragPin(lat, lng);
      } else {
        handlersRef.current.setPin(lat, lng);
      }
      playPinDrop();
    });

    mapRef.current = map;

    // ResizeObserver — MapLibre doesn't notice container size changes
    // by default (e.g. when /play toggles the minimap between 240 px
    // and full-overlay). Watch the container and call map.resize()
    // on every box change so the canvas stays in sync.
    let resizeObs: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      resizeObs = new ResizeObserver(() => {
        // Defer one frame so the new size is applied before MapLibre
        // reads it back — otherwise the resize lags one tick behind.
        requestAnimationFrame(() => {
          map.resize();
        });
      });
      resizeObs.observe(containerRef.current);
    }

    return () => {
      resizeObs?.disconnect();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Sync marker + hint ring to the current pin.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Marker
    if (pinPosition) {
      if (!markerRef.current) {
        markerRef.current = new maplibregl.Marker({
          element: buildPinElement(),
          anchor: 'bottom',
        })
          .setLngLat([pinPosition.lng, pinPosition.lat])
          .addTo(map);
      } else {
        markerRef.current.setLngLat([pinPosition.lng, pinPosition.lat]);
      }
    } else if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }

    // Ring — guard with isStyleLoaded so we don't race the map load event.
    const applyRing = () => {
      const src = map.getSource('pin-ring') as maplibregl.GeoJSONSource | undefined;
      if (!src) return;
      if (pinPosition) {
        src.setData({
          type: 'FeatureCollection',
          features: [circlePolygon(pinPosition.lat, pinPosition.lng, PIN_HINT_RADIUS_M)],
        });
      } else {
        src.setData({ type: 'FeatureCollection', features: [] });
      }
    };
    if (map.isStyleLoaded()) applyRing();
    else map.once('load', applyRing);
  }, [pinPosition]);

  return <div ref={containerRef} className="w-full h-full" />;
}
