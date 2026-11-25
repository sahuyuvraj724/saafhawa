import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { INDIAN_CITIES } from '../data/cities';
import {
  clearReverseGeocodeCache,
  fetchLiveAirQuality,
  formatNearYouFallback,
  formatNominatimPlaceName,
  mapGeocodingResultToCity,
  reverseGeocodeCoordinates,
  searchIndianPlaces,
} from './openMeteo';

describe('Open-Meteo and Nominatim service functions (all network mocked)', () => {
  beforeEach(() => {
    clearReverseGeocodeCache();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    clearReverseGeocodeCache();
  });

  it('fetchLiveAirQuality parses valid Open-Meteo response and rejects on HTTP/network errors', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          timezone: 'Asia/Kolkata',
          current: {
            time: '2026-11-22T14:00',
            us_aqi: 142,
            pm2_5: 52.8,
            pm10: 81.4,
          },
          hourly: {
            time: ['2026-11-22T13:00', '2026-11-22T14:00'],
            us_aqi: [130, 142],
            pm2_5: [48, 52.8],
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );
    vi.stubGlobal('fetch', fetchMock);

    const live = await fetchLiveAirQuality(INDIAN_CITIES[0]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain('air-quality-api.open-meteo.com');
    expect(live.current.usAqi).toBe(142);
    expect(live.current.pm25).toBe(52.8);

    fetchMock.mockResolvedValueOnce(new Response('Server Error', { status: 500 }));
    await expect(fetchLiveAirQuality(INDIAN_CITIES[0])).rejects.toThrow('HTTP 500');

    fetchMock.mockRejectedValueOnce(new Error('Network down'));
    await expect(fetchLiveAirQuality(INDIAN_CITIES[0])).rejects.toThrow('Network down');
  });

  it('searchIndianPlaces parses Indian geocoding results, handles empty results, and rejects on API error', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    // Fewer than 2 letters must NOT call the network
    expect(await searchIndianPlaces('R')).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();

    // Valid results with same-name Indian cities and a non-IN entry filtered out
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          results: [
            {
              id: 1258526,
              name: 'Rampur',
              latitude: 28.8154,
              longitude: 79.025,
              country_code: 'IN',
              admin1: 'Uttar Pradesh',
              admin2: 'Rampur',
            },
            {
              id: 999,
              name: 'Rampur',
              latitude: 27.0,
              longitude: 85.0,
              country_code: 'NP',
              admin1: 'Outside',
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const places = await searchIndianPlaces('Rampur');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain('countryCode=IN');
    expect(places).toHaveLength(1);
    expect(places[0]).toMatchObject({
      name: 'Rampur',
      hindiName: 'रामपुर',
      district: 'Rampur',
      state: 'Uttar Pradesh',
    });

    // Empty search results
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } })
    );
    expect(await searchIndianPlaces('Zzznoplace')).toEqual([]);

    // API failure
    fetchMock.mockResolvedValueOnce(new Response('Unavailable', { status: 503 }));
    await expect(searchIndianPlaces('Jaipur')).rejects.toThrow('HTTP 503');
  });

  it('mapGeocodingResultToCity handles missing admin fields gracefully', () => {
    const city = mapGeocodingResultToCity({
      id: 42,
      name: 'TestTown',
      latitude: 22.1,
      longitude: 78.2,
    });
    expect(city.district).toBeUndefined();
    expect(city.state).toBe('India');
    expect(city.hindiName).toBe('TestTown');
  });

  it('formatNominatimPlaceName and reverseGeocodeCoordinates format, cache, and fall back safely', async () => {
    expect(
      formatNominatimPlaceName({
        suburb: 'Malviya Nagar',
        city: 'Jaipur',
        state: 'Rajasthan',
      })
    ).toBe('Malviya Nagar, Jaipur, Rajasthan');
    expect(
      formatNominatimPlaceName({
        village: 'Baragaon',
        state_district: 'Jhansi',
        state: 'Uttar Pradesh',
      })
    ).toBe('Baragaon, Jhansi, Uttar Pradesh');
    expect(
      formatNominatimPlaceName({
        town: 'Sohna',
        state_district: 'Gurugram',
        state: 'Haryana',
      })
    ).toBe('Sohna, Gurugram, Haryana');
    expect(
      formatNominatimPlaceName({ suburb: 'Connaught Place', city: 'Delhi', state: 'Delhi' })
    ).toBe('Connaught Place, Delhi');
    expect(formatNominatimPlaceName({})).toBeNull();
    expect(formatNearYouFallback(26.8549, 75.8243)).toBe('Near you (26.8549, 75.8243)');

    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          address: {
            suburb: 'Malviya Nagar',
            city: 'Jaipur',
            state: 'Rajasthan',
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const first = await reverseGeocodeCoordinates(26.85491, 75.82431, mockFetch as unknown as typeof fetch);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(String(mockFetch.mock.calls[0][0])).toContain(
      'nominatim.openstreetmap.org/reverse?lat=26.8549&lon=75.8243&format=json&zoom=14&accept-language=en'
    );
    expect(first.name).toBe('Malviya Nagar, Jaipur, Rajasthan');

    // Second call uses cache (0 additional network calls)
    const second = await reverseGeocodeCoordinates(26.85494, 75.82434, mockFetch as unknown as typeof fetch);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(second.name).toBe('Malviya Nagar, Jaipur, Rajasthan');

    // Failure falls back to Near you (lat, lon)
    const failingFetch = vi.fn().mockRejectedValue(new Error('offline'));
    const fallback = await reverseGeocodeCoordinates(
      28.4595,
      77.0266,
      failingFetch as unknown as typeof fetch
    );
    expect(fallback.name).toBe('Near you (28.4595, 77.0266)');
    expect(fallback.latitude).toBe(28.4595);
    expect(fallback.longitude).toBe(77.0266);
  });
});
