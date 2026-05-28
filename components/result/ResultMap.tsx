'use client';

import { useEffect, useRef } from 'react';
import maplibregl, { type Map as MlMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const STYLE_URL = '/assets/style/cyber-purple-style.json';

interface Props {
  guess: { lat: number; lng: number };
  target: { lat: number; lng: number; name: string };
}

function buildGuessElement(): HTMLDivElement {
  const el = document.createElement('div');
  el.innerHTML = `
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="14" fill="rgba(34,211,238,0.2)" stroke="#22D3EE" stroke-width="2"/>
      <circle cx="16" cy="16" r="6" fill="#22D3EE"/>
      <circle cx="16" cy="16" r="6" fill="none" stroke="#fff" stroke-width="2"/>
    </svg>
  `;
  return el;
}

function buildTargetElement(name: string): HTMLDivElement {
  const el = document.createElement('div');
  el.style.cssText = 'position:relative;width:44px;height:56px;filter:drop-shadow(0 0 10px rgba(253,24,3,.7));';
  el.title = name;
  el.innerHTML = `
    <svg width="44" height="56" viewBox="0 0 36 48" xmlns="http://www.w3.org/2000/svg">
      <polygon points="18,4 32,18 32,32 18,44 4,32 4,18" fill="#FD1803" stroke="#fff" stroke-width="2"/>
      <text x="18" y="29" text-anchor="middle" font-size="14">🪙</text>
    </svg>
  `;
  return el;
}

export default function ResultMap({ guess, target }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MlMap | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      attributionControl: false,
      // Initial framing — fit-bounds called below once style loads.
      center: [(guess.lng + target.lng) / 2, (guess.lat + target.lat) / 2],
      zoom: 11,
      interactive: true,
    });
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    map.on('load', () => {
      // Connecting line — dashed gold, mirrors the original Leaflet styling.
      map.addSource('connect', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [
              [guess.lng, guess.lat],
              [target.lng, target.lat],
            ],
          },
        },
      });
      map.addLayer({
        id: 'connect-line',
        type: 'line',
        source: 'connect',
        paint: {
          'line-color': '#FBBF24',
          'line-width': 2.5,
          'line-dasharray': [3, 4],
        },
      });

      // Markers
      new maplibregl.Marker({ element: buildGuessElement(), anchor: 'center' })
        .setLngLat([guess.lng, guess.lat])
        .addTo(map);
      new maplibregl.Marker({ element: buildTargetElement(target.name), anchor: 'bottom' })
        .setLngLat([target.lng, target.lat])
        .addTo(map);

      // Fit both points with padding so neither marker hugs the edge.
      const bounds = new maplibregl.LngLatBounds(
        [Math.min(guess.lng, target.lng), Math.min(guess.lat, target.lat)],
        [Math.max(guess.lng, target.lng), Math.max(guess.lat, target.lat)],
      );
      map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 0 });
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // Effect runs once; guess/target identity is stable for the lifetime
    // of this debrief screen so we don't want fit-bounds re-triggering.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className="w-full h-full" />;
}
