import type { Point } from 'typeorm';
import type { Coordinates } from '@housingcom/contracts';

/** GeoJSON stores [lng, lat]; the API speaks { lat, lng }. */
export const toPoint = ({ lat, lng }: Coordinates): Point => ({
  type: 'Point',
  coordinates: [lng, lat],
});

export const fromPoint = (point: Point): Coordinates => ({
  lat: point.coordinates[1] ?? 0,
  lng: point.coordinates[0] ?? 0,
});
