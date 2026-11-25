import {
  formatCoordinatesSubtitle,
  lookupHindiCityName,
  type IndianCity,
} from '../data/cities';
import {
  parseOpenMeteoResponse,
  type LiveAirQualityData,
  type OpenMeteoAirQualityResponse,
} from '../utils/aqi';

const AIR_QUALITY_ENDPOINT = 'https://air-quality-api.open-meteo.com/v1/air-quality';
const GEOCODING_ENDPOINT = 'https://geocoding-api.open-meteo.com/v1/search';
const NOMINATIM_REVERSE_ENDPOINT = 'https://nominatim.openstreetmap.org/reverse';
const REVERSE_GEO_STORAGE_KEY = 'saafhawa:nominatim-reverse-cache:v1';

export async function fetchLiveAirQuality(
  city: IndianCity,
  signal?: AbortSignal
): Promise<LiveAirQualityData> {
  const params = new URLSearchParams({
    latitude: city.latitude.toString(),
    longitude: city.longitude.toString(),
    current: 'us_aqi,pm2_5,pm10',
    hourly: 'pm2_5,us_aqi',
    forecast_days: '3',
    timezone: 'Asia/Kolkata',
  });

  const response = await fetch(`${AIR_QUALITY_ENDPOINT}?${params.toString()}`, {
    signal,
  });

  if (!response.ok) {
    throw new Error(`Open-Meteo returned HTTP ${response.status}`);
  }

  const json = (await response.json()) as OpenMeteoAirQualityResponse;
  return parseOpenMeteoResponse(json, city);
}

export interface OpenMeteoGeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country_code?: string;
  admin1?: string; // State
  admin2?: string; // District
  admin3?: string;
}

export function mapGeocodingResultToCity(
  item: OpenMeteoGeocodingResult
): IndianCity {
  const district = item.admin2?.trim() || item.admin3?.trim() || undefined;
  const state = item.admin1?.trim() || 'India';
  return {
    id: `in-${item.id}`,
    name: item.name.trim(),
    hindiName: lookupHindiCityName(item.name),
    district,
    state,
    latitude: item.latitude,
    longitude: item.longitude,
  };
}

/**
 * Searches ANY place in India via the free Open-Meteo Geocoding API.
 * Uses count=8&countryCode=IN&language=en as requested.
 */
export async function searchIndianPlaces(
  query: string,
  signal?: AbortSignal
): Promise<IndianCity[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const params = new URLSearchParams({
    name: trimmed,
    count: '8',
    countryCode: 'IN',
    language: 'en',
  });

  const response = await fetch(`${GEOCODING_ENDPOINT}?${params.toString()}`, {
    signal,
  });

  if (!response.ok) {
    throw new Error(`Place search failed (HTTP ${response.status})`);
  }

  const data = (await response.json()) as {
    results?: OpenMeteoGeocodingResult[];
  };
  const results = data.results ?? [];

  return results
    .filter((item) => !item.country_code || item.country_code === 'IN')
    .map(mapGeocodingResultToCity);
}

export interface NominatimAddress {
  suburb?: string;
  village?: string;
  town?: string;
  city?: string;
  state_district?: string;
  state?: string;
}

export interface NominatimReverseResponse {
  address?: NominatimAddress;
  display_name?: string;
}

/**
 * Formats Nominatim address fields into "Area, City, State":
 * - Area: suburb || village || town
 * - City: city || state_district
 * - State: state
 */
export function formatNominatimPlaceName(
  address?: NominatimAddress
): string | null {
  if (!address) return null;

  const area =
    address.suburb?.trim() ||
    address.village?.trim() ||
    address.town?.trim() ||
    '';
  const city =
    address.city?.trim() || address.state_district?.trim() || '';
  const state = address.state?.trim() || '';

  const parts: string[] = [];
  const seen = new Set<string>();

  for (const part of [area, city, state]) {
    if (!part) continue;
    const key = part.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      parts.push(part);
    }
  }

  return parts.length > 0 ? parts.join(', ') : null;
}

export function formatNearYouFallback(
  latitude: number,
  longitude: number
): string {
  const latStr = Number(latitude.toFixed(4)).toString();
  const lonStr = Number(longitude.toFixed(4)).toString();
  return `Near you (${latStr}, ${lonStr})`;
}

const reverseGeoMemoryCache = new Map<string, string>();
const reverseGeoInFlight = new Map<string, Promise<string | null>>();

function getReverseGeoCacheKey(latitude: number, longitude: number): string {
  // ~110 m precision so repeated taps in the same neighborhood reuse cache
  return `${latitude.toFixed(3)},${longitude.toFixed(3)}`;
}

function readPersistentReverseCache(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(REVERSE_GEO_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, string>;
    return typeof parsed[key] === 'string' && parsed[key].trim()
      ? parsed[key]
      : null;
  } catch {
    return null;
  }
}

function writePersistentReverseCache(key: string, placeName: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(REVERSE_GEO_STORAGE_KEY);
    const parsed: Record<string, string> = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    const keys = Object.keys(parsed);
    if (keys.length >= 25) {
      delete parsed[keys[0]];
    }
    parsed[key] = placeName;
    window.localStorage.setItem(REVERSE_GEO_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // Ignore storage quota / privacy mode errors
  }
}

export function clearReverseGeocodeCache(): void {
  reverseGeoMemoryCache.clear();
  reverseGeoInFlight.clear();
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(REVERSE_GEO_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }
}

/**
 * Resolves coordinates to "Area, City, State" using the free OpenStreetMap
 * Nominatim reverse geocoding API. Calls the API at most once per tap for
 * uncached coordinates, caches successful results, and falls back cleanly to
 * "Near you (lat, lon)" if the lookup fails so AQI still loads.
 */
export async function reverseGeocodeCoordinates(
  latitude: number,
  longitude: number,
  fetchFn: typeof fetch = fetch
): Promise<IndianCity> {
  const lat = Math.round(latitude * 10000) / 10000;
  const lon = Math.round(longitude * 10000) / 10000;
  const cacheKey = getReverseGeoCacheKey(lat, lon);

  let resolvedName: string | null =
    reverseGeoMemoryCache.get(cacheKey) ?? readPersistentReverseCache(cacheKey);

  if (resolvedName) {
    reverseGeoMemoryCache.set(cacheKey, resolvedName);
  } else {
    let pending = reverseGeoInFlight.get(cacheKey);
    if (!pending) {
      pending = (async () => {
        const controller =
          typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timeoutId = controller
          ? globalThis.setTimeout(() => controller.abort(), 8000)
          : null;

        try {
          const url = `${NOMINATIM_REVERSE_ENDPOINT}?lat=${encodeURIComponent(
            String(lat)
          )}&lon=${encodeURIComponent(String(lon))}&format=json&zoom=14&accept-language=en`;

          const response = await fetchFn(url, {
            signal: controller?.signal,
          });
          if (!response.ok) {
            return null;
          }

          const payload = (await response.json()) as NominatimReverseResponse;
          const formatted = formatNominatimPlaceName(payload.address);
          if (formatted) {
            reverseGeoMemoryCache.set(cacheKey, formatted);
            writePersistentReverseCache(cacheKey, formatted);
          }
          return formatted;
        } catch {
          return null;
        } finally {
          if (timeoutId !== null) {
            globalThis.clearTimeout(timeoutId);
          }
          reverseGeoInFlight.delete(cacheKey);
        }
      })();

      reverseGeoInFlight.set(cacheKey, pending);
    }

    resolvedName = await pending;
  }

  if (resolvedName) {
    return {
      id: `loc-${lat}-${lon}`,
      name: resolvedName,
      hindiName: resolvedName,
      state: formatCoordinatesSubtitle(lat, lon),
      latitude: lat,
      longitude: lon,
      isCurrentLocation: true,
    };
  }

  const fallbackName = formatNearYouFallback(lat, lon);
  return {
    id: `loc-${lat}-${lon}`,
    name: fallbackName,
    hindiName: fallbackName,
    state: 'Current location',
    latitude: lat,
    longitude: lon,
    isCurrentLocation: true,
  };
}
