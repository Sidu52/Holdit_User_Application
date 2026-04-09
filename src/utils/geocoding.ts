/**
 * Free Geocoding Utilities using OpenStreetMap Nominatim
 * No API keys required
 * Rate limit: 5 requests/second
 * 
 * Fixed TypeScript types for Response and Promise.race
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache key prefix
const CACHE_PREFIX = 'nominatim_';
const CACHE_EXPIRY_DAYS = 30; // Cache geocoding for 30 days

// Configuration
const NOMINATIM_CONFIG = {
  baseUrl: 'https://nominatim.openstreetmap.org',
  userAgent: 'AddressApp/1.0', // Required by Nominatim ToS
  timeout: 5000,
  retries: 2,
};

// Types
export interface GeocodedAddress {
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  display_name?: string;
}

export interface AddressSearchResult {
  display_name: string;
  latitude: number;
  longitude: number;
  address: GeocodedAddress;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Generate cache key for geocoding result
 * Rounds coordinates to reduce cache variations for nearby locations
 */
const generateCacheKey = (latitude: number, longitude: number): string => {
  const lat = Math.round(latitude * 1000) / 1000; // ~100m precision
  const lng = Math.round(longitude * 1000) / 1000;
  return `${CACHE_PREFIX}${lat}_${lng}`;
};

/**
 * Get cached geocoding result
 */
const getFromCache = async (latitude: number, longitude: number): Promise<GeocodedAddress | null> => {
  try {
    const key = generateCacheKey(latitude, longitude);
    const cached = await AsyncStorage.getItem(key);
    
    if (!cached) return null;
    
    const data = JSON.parse(cached);
    const expiryTime = new Date(data.timestamp).getTime() + (CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    
    // Check if cache has expired
    if (Date.now() > expiryTime) {
      await AsyncStorage.removeItem(key);
      return null;
    }
    
    return data.address;
  } catch (err) {
    console.warn('Cache read failed:', err);
    return null;
  }
};

/**
 * Save geocoding result to cache
 */
const saveToCache = async (
  latitude: number,
  longitude: number,
  address: GeocodedAddress
): Promise<void> => {
  try {
    const key = generateCacheKey(latitude, longitude);
    const data = {
      address,
      timestamp: new Date().toISOString(),
    };
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn('Cache write failed:', err);
  }
};

/**
 * Fetch from Nominatim with retries and proper timeout handling
 * Fixed TypeScript: Promise.race<Response> ensures proper typing
 */
const fetchFromNominatim = async (
  url: string,
  retries: number = NOMINATIM_CONFIG.retries
): Promise<any> => {
  try {
    // Create timeout promise with proper typing
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error('Nominatim request timeout')),
        NOMINATIM_CONFIG.timeout
      )
    );

    // Create fetch promise
    const fetchPromise = fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': NOMINATIM_CONFIG.userAgent,
      },
    });

    // Race between fetch and timeout
    const response = await Promise.race<Response>([fetchPromise, timeoutPromise]);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    if (retries > 0) {
      // Exponential backoff: 500ms, 1s, 2s
      const delay = 500 * Math.pow(2, NOMINATIM_CONFIG.retries - retries);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchFromNominatim(url, retries - 1);
    }
    throw err;
  }
};

/**
 * Parse Nominatim response into standardized format
 */
const parseNominatimAddress = (nominatimData: any): GeocodedAddress => {
  const addr = nominatimData.address || {};

  return {
    street: addr.house_number && addr.road
      ? `${addr.house_number} ${addr.road}`
      : addr.road || addr.house_number || '',
    city: addr.city || addr.town || addr.village || '',
    state: addr.state || addr.county || '',
    postal_code: addr.postcode || '',
    country: addr.country || 'India',
    display_name: nominatimData.display_name,
  };
};

/**
 * Reverse geocoding: Get address from latitude/longitude
 * This is the main function you'll use for your address form
 * 
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @returns Geocoded address or null if failed
 */
export const reverseGeocode = async (
  latitude: number,
  longitude: number
): Promise<GeocodedAddress | null> => {
  try {
    // Check cache first
    const cached = await getFromCache(latitude, longitude);
    if (cached) {
      console.log('Using cached geocoding result');
      return cached;
    }

    // Fetch from Nominatim
    const url = `${NOMINATIM_CONFIG.baseUrl}/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
    
    const data = await fetchFromNominatim(url);

    if (!data || !data.address) {
      console.warn('Nominatim returned empty address');
      return null;
    }

    const address = parseNominatimAddress(data);

    // Cache the result
    await saveToCache(latitude, longitude, address);

    return address;
  } catch (err) {
    console.error('Reverse geocoding failed:', err);
    return null;
  }
};

/**
 * Forward geocoding: Search for address by text
 * Returns array of matching addresses with coordinates
 * 
 * @param query - Search query (min 2 characters)
 * @returns Array of matching addresses
 */
export const searchAddress = async (query: string): Promise<AddressSearchResult[]> => {
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    const url = `${NOMINATIM_CONFIG.baseUrl}/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=in&addressdetails=1`;
    
    const results = await fetchFromNominatim(url);

    if (!Array.isArray(results)) {
      return [];
    }

    return results.map(result => ({
      display_name: result.display_name,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      address: parseNominatimAddress(result),
    }));
  } catch (err) {
    console.error('Address search failed:', err);
    return [];
  }
};

/**
 * Lookup: Get detailed address information for a specific OSM object
 * Useful if you have an OSM ID from another source
 * 
 * @param osmId - OpenStreetMap object ID
 * @param osmType - Type of OSM object (node, way, or relation)
 * @returns Geocoded address or null if not found
 */
export const lookupOSMObject = async (
  osmId: number,
  osmType: 'node' | 'way' | 'relation' = 'way'
): Promise<GeocodedAddress | null> => {
  try {
    const url = `${NOMINATIM_CONFIG.baseUrl}/lookup?format=json&osm_ids=${osmType[0].toUpperCase()}${osmId}&addressdetails=1`;
    
    const results = await fetchFromNominatim(url);

    if (!Array.isArray(results) || results.length === 0) {
      return null;
    }

    const address = parseNominatimAddress(results[0]);
    
    // Cache this result
    if (results[0].lat && results[0].lon) {
      await saveToCache(
        parseFloat(results[0].lat),
        parseFloat(results[0].lon),
        address
      );
    }

    return address;
  } catch (err) {
    console.error('OSM lookup failed:', err);
    return null;
  }
};

/**
 * Clear entire geocoding cache
 */
export const clearGeocodingCache = async (): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
    await AsyncStorage.multiRemove(cacheKeys);
    console.log(`Cleared ${cacheKeys.length} cached geocoding results`);
  } catch (err) {
    console.error('Cache clearing failed:', err);
  }
};

/**
 * Get cache size in KB
 */
export const getCacheSizeKB = async (): Promise<number> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
    
    let totalSize = 0;
    for (const key of cacheKeys) {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        totalSize += value.length;
      }
    }

    return totalSize / 1024; // Convert to KB
  } catch (err) {
    console.error('Cache size calculation failed:', err);
    return 0;
  }
};

/**
 * Debounced reverse geocode - prevents excessive API calls during form interactions
 */
let geocodeTimeout: ReturnType<typeof setTimeout> | null = null;

export const reverseGeocodeDebounced = (
  latitude: number,
  longitude: number,
  onResult: (address: GeocodedAddress | null) => void,
  delay: number = 500
): void => {
  if (geocodeTimeout) {
    clearTimeout(geocodeTimeout);
  }

  geocodeTimeout = setTimeout(() => {
    reverseGeocode(latitude, longitude).then(onResult);
  }, delay);
};

/**
 * Cancel pending debounced geocode request
 */
export const cancelPendingGeocode = (): void => {
  if (geocodeTimeout) {
    clearTimeout(geocodeTimeout);
    geocodeTimeout = null;
  }
};

/**
 * Mock data for testing (use when offline or in development)
 */
export const getMockAddresses = (): AddressSearchResult[] => {
  return [
    {
      display_name: 'Fort, Mumbai, Maharashtra, India',
      latitude: 18.9425,
      longitude: 72.8239,
      address: {
        street: '123 Dalal Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        postal_code: '400001',
        country: 'India',
      },
    },
    {
      display_name: 'Andheri West, Mumbai, Maharashtra, India',
      latitude: 19.1136,
      longitude: 72.8281,
      address: {
        street: 'Linking Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        postal_code: '400058',
        country: 'India',
      },
    },
    {
      display_name: 'Pune, Maharashtra, India',
      latitude: 18.5204,
      longitude: 73.8567,
      address: {
        street: 'MG Road',
        city: 'Pune',
        state: 'Maharashtra',
        postal_code: '411001',
        country: 'India',
      },
    },
  ];
};