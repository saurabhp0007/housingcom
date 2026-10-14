import { NearbyPlaceCategory } from '@housingcom/contracts';
import { GooglePlacesProvider } from './google-places.provider.js';

const json = (body: unknown, ok = true) =>
  ({ ok, status: ok ? 200 : 500, json: async () => body }) as Response;

describe('GooglePlacesProvider', () => {
  it('maps autocomplete predictions and sends the key, region and bias', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      json({
        suggestions: [
          {
            placePrediction: {
              placeId: 'p1',
              structuredFormat: {
                mainText: { text: 'Christ University' },
                secondaryText: { text: 'Hosur Road, Bengaluru' },
              },
            },
          },
        ],
      }),
    );
    const provider = new GooglePlacesProvider('KEY', fetchMock);
    const out = await provider.autocomplete('christ', { lat: 12.9, lng: 77.6 }, 'tok');

    expect(out).toEqual([
      {
        id: 'p1',
        source: 'google',
        title: 'Christ University',
        subtitle: 'Hosur Road, Bengaluru',
        location: null,
      },
    ]);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://places.googleapis.com/v1/places:autocomplete');
    expect(init.headers['x-goog-api-key']).toBe('KEY');
    expect(JSON.parse(init.body)).toMatchObject({
      input: 'christ',
      includedRegionCodes: ['in'],
      sessionToken: 'tok',
    });
  });

  it('maps details to coordinates', async () => {
    const provider = new GooglePlacesProvider(
      'KEY',
      vi
        .fn()
        .mockResolvedValue(
          json({
            id: 'p1',
            displayName: { text: 'X' },
            formattedAddress: 'Addr',
            location: { latitude: 1, longitude: 2 },
          }),
        ),
    );
    expect(await provider.details('p1', undefined)).toEqual({
      id: 'p1',
      title: 'X',
      address: 'Addr',
      location: { lat: 1, lng: 2 },
    });
  });

  it('asks for the nearest metro by distance', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        json({
          places: [{ displayName: { text: 'HSR Metro' }, location: { latitude: 1, longitude: 2 } }],
        }),
      );
    const provider = new GooglePlacesProvider('KEY', fetchMock);
    expect(await provider.nearest(NearbyPlaceCategory.Metro, { lat: 1, lng: 2 }, 3000)).toEqual({
      name: 'HSR Metro',
      location: { lat: 1, lng: 2 },
    });
    expect(JSON.parse(fetchMock.mock.calls[0]![1].body)).toMatchObject({
      includedTypes: ['subway_station', 'light_rail_station'],
      rankPreference: 'DISTANCE',
      maxResultCount: 1,
    });
  });

  it('degrades to empty results on API errors', async () => {
    const provider = new GooglePlacesProvider('KEY', vi.fn().mockResolvedValue(json({}, false)));
    expect(await provider.autocomplete('x', undefined, undefined)).toEqual([]);
    expect(await provider.details('x', undefined)).toBeNull();
  });
});
