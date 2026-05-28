/**
 * Walker math for street view navigation.
 *
 * The player steps around in Google Street View by us re-rendering the
 * Embed iframe at a new lat/lng each tap. Distances + bearings use
 * haversine forward / inverse formulas. All values in metres unless
 * suffixed `_km`. Ported from gohunter-v2 lib/guess/walker-math.ts.
 */

/**
 * Walker step distance in meters. Tuned to match Google Street View
 * pano spacing in Bangkok — typical arterial 8–12m, soi 12–20m.
 * Embed API auto-snaps to the nearest pano within ~50m, so 15m
 * sweet-spots between "stuck on same pano" and "teleport overshoot".
 */
export const STEP_DISTANCE_M = 15;

/** Rotation step in degrees — natural neck-turn feel. */
export const ROTATE_STEP_DEG = 30;

const EARTH_RADIUS_M = 6378137;

/** Walk forward from (lat,lng) in headingDeg direction by distanceM. */
export function walkFrom(
  lat: number,
  lng: number,
  headingDeg: number,
  distanceM: number,
): { lat: number; lng: number } {
  const angular = distanceM / EARTH_RADIUS_M;
  const theta = (headingDeg * Math.PI) / 180;
  const phi1 = (lat * Math.PI) / 180;
  const lambda1 = (lng * Math.PI) / 180;

  const phi2 = Math.asin(
    Math.sin(phi1) * Math.cos(angular) +
      Math.cos(phi1) * Math.sin(angular) * Math.cos(theta),
  );
  const lambda2 =
    lambda1 +
    Math.atan2(
      Math.sin(theta) * Math.sin(angular) * Math.cos(phi1),
      Math.cos(angular) - Math.sin(phi1) * Math.sin(phi2),
    );

  return {
    lat: (phi2 * 180) / Math.PI,
    lng: (lambda2 * 180) / Math.PI,
  };
}

/** Pick a random bearing × radius offset from a target lat/lng. */
export function randomSpawnPoint(
  lat: number,
  lng: number,
  radiusM: number,
): { lat: number; lng: number } {
  const bearing = Math.random() * 360;
  return walkFrom(lat, lng, bearing, radiusM);
}

/** Normalize a heading to [0, 360). */
export function normalizeHeading(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/** Compass bearing → nearest cardinal/intercardinal letter
 *  (N/NE/E/SE/S/SW/W/NW). Used by the SV compass strip HUD. */
export function cardinalForHeading(deg: number): string {
  const cardinals = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const idx = Math.round(normalizeHeading(deg) / 45) % 8;
  return cardinals[idx];
}
