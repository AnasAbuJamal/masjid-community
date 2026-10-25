/** Accept either the backend origin or its /api URL. */
export function resolveApiUrl(configured?: string): string {
  const base = (configured?.trim() || 'http://localhost:3000').replace(/\/+$/, '');
  return base.endsWith('/api') ? base : `${base}/api`;
}
export const DEMO_MODE = process.env.EXPO_PUBLIC_DEMO_MODE === 'true';
