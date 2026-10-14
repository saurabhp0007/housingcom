import type { PlacesProvider } from '../interfaces/places-provider.interface.js';

/** Used when no Google key is configured: search falls back to our own areas. */
export class NoopPlacesProvider implements PlacesProvider {
  readonly isEnabled = false;
  autocomplete = async () => [];
  details = async () => null;
  nearest = async () => null;
}
