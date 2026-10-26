/**
 * Initial great-circle bearing from an observer to the Kaaba in degrees clockwise
 * from geographic (true) north. This is not a live magnetic compass heading.
 */
const KAABA_LAT = 21.4225;
const KAABA_LON = 39.8262;
const RAD = Math.PI / 180;

export function qiblaBearing(latitude: number, longitude: number): number {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
      latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180)
    throw new RangeError('Latitude or longitude out of range');

  const p1 = latitude * RAD;
  const p2 = KAABA_LAT * RAD;
  const delta = (KAABA_LON - longitude) * RAD;
  const y = Math.sin(delta) * Math.cos(p2);
  const x = Math.cos(p1) * Math.sin(p2) -
    Math.sin(p1) * Math.cos(p2) * Math.cos(delta);
  // Undefined when observer coincides with Kaaba or is exactly antipodal.
  if (Math.abs(x) < 1e-12 && Math.abs(y) < 1e-12)
    throw new RangeError('Qibla bearing is undefined at this location');
  return (Math.atan2(y, x) / RAD + 360) % 360;
}

export function cardinalDirection(degrees: number): string {
  if (!Number.isFinite(degrees)) return 'Unknown';
  const points = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return points[Math.round(((degrees % 360) + 360) % 360 / 45) % 8];
}
