import type { SavedSearchResponse } from '@housingcom/contracts';
import { fromPoint } from '../../../core/utils/geo.util.js';
import type { SavedSearch } from '../entities/saved-search.entity.js';

export function toSavedSearchResponse(s: SavedSearch): SavedSearchResponse {
  return {
    id: s.id,
    label: s.label,
    center: fromPoint(s.location),
    radiusKm: s.radiusKm,
    filters: s.filters,
    alertsEnabled: s.alertsEnabled,
    createdAt: s.createdAt.toISOString(),
  };
}
