const EARTH_RADIUS = 6371000;

export function latLonToMeters(lat: number, lon: number, centerLat: number, centerLon: number): [number, number, number] {
  const dx = (lon - centerLon) * (Math.PI / 180) * EARTH_RADIUS * Math.cos(centerLat * Math.PI / 180);
  const dz = -(lat - centerLat) * (Math.PI / 180) * EARTH_RADIUS; // -z is North in Three.js
  return [dx, 0, dz];
}
