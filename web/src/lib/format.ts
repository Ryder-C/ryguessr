/** Format a distance in kilometers for display, e.g. "640 m", "12.4 km", "1,284 km". */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 100) return `${km.toFixed(1)} km`;
  return `${Math.round(km).toLocaleString()} km`;
}

export const MAX_ROUND_SCORE = 5000;
