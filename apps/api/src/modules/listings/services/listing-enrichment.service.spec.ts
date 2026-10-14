import { NearbyPlaceCategory } from '@housingcom/contracts';
import type { Queue } from 'bullmq';
import type { PlacesProvider } from '../../places/interfaces/places-provider.interface.js';
import type {
  ListingsRepository,
  NearbyPlaceRow,
} from '../interfaces/listings-repository.interface.js';
import { ListingEnrichmentService, type NearbyJob } from './listing-enrichment.service.js';

const listing = { id: 'l1', location: { type: 'Point', coordinates: [77.6446, 12.9121] } };

function setup(enabled = true) {
  const saved: NearbyPlaceRow[][] = [];
  const repo = {
    findById: vi.fn().mockResolvedValue(listing),
    replaceNearbyPlaces: vi.fn(
      async (_id: string, rows: NearbyPlaceRow[]) => void saved.push(rows),
    ),
  } as unknown as ListingsRepository;
  const provider: PlacesProvider = {
    isEnabled: enabled,
    autocomplete: vi.fn(),
    details: vi.fn(),
    // A metro ~1.1 km north; nothing else found nearby.
    nearest: vi.fn(async (category) =>
      category === NearbyPlaceCategory.Metro
        ? { name: 'HSR Metro', location: { lat: 12.9221, lng: 77.6446 } }
        : null,
    ),
  };
  const queue = { add: vi.fn() } as unknown as Queue<NearbyJob>;
  return { service: new ListingEnrichmentService(queue, repo, provider), saved, queue, provider };
}

describe('ListingEnrichmentService', () => {
  it('stores the nearest place per category with its distance', async () => {
    const { service, saved } = setup();
    await service.computeNearby('l1');
    expect(saved[0]).toEqual([{ category: 'metro', name: 'HSR Metro', distanceM: 1112 }]);
  });

  it('queues one deduplicated job per listing', async () => {
    const { service, queue } = setup();
    await service.schedule('l1');
    expect(queue.add).toHaveBeenCalledWith(
      'nearby-places',
      { listingId: 'l1' },
      expect.objectContaining({ jobId: 'nearby-l1' }),
    );
  });

  it('does nothing when no places provider is configured', async () => {
    const { service, queue } = setup(false);
    await service.schedule('l1');
    expect(queue.add).not.toHaveBeenCalled();
  });
});
