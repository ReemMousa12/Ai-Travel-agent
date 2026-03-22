/**
 * Location Detection and Management Module
 * Handles geolocation detection using browser Geolocation API
 * and reverse geocoding to get city/country information
 */

export interface UserLocation {
  city: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  error?: string;
}

/**
 * Detect user's current location using browser Geolocation API
 * and reverse geocode to get city/country information
 */
export async function detectUserLocation(): Promise<UserLocation> {
  try {
    // First, get coordinates from browser Geolocation API
    const coordinates = await getCurrentCoordinates();
    
    // Then, reverse geocode to get city and country
    const locationData = await reverseGeocode(coordinates.latitude, coordinates.longitude);
    
    return {
      ...locationData,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude
    };
  } catch (error) {
    console.error('❌ Error detecting location:', error);
    return {
      city: 'Unknown',
      country: 'Unknown',
      countryCode: 'XX',
      latitude: 0,
      longitude: 0,
      error: error instanceof Error ? error.message : 'Failed to detect location'
    };
  }
}

/**
 * Get current coordinates from browser Geolocation API
 */
function getCurrentCoordinates(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation API not supported in this browser'));
      return;
    }

    console.log('📍 Requesting geolocation permission from browser...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log('✅ Geolocation obtained:', { latitude, longitude });
        resolve({ latitude, longitude });
      },
      (error) => {
        console.error('❌ Geolocation error:', error.message);
        reject(new Error(`Geolocation failed: ${error.message}`));
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000 // Cache location for 5 minutes
      }
    );
  });
}

/**
 * Reverse geocode coordinates to get city and country
 * Uses Open-Meteo Geocoding API (free, no API key required)
 */
async function reverseGeocode(latitude: number, longitude: number): Promise<{
  city: string;
  country: string;
  countryCode: string;
}> {
  try {
    console.log('🌍 Reverse geocoding coordinates:', { latitude, longitude });
    
    // Using Open-Meteo's free geocoding API
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&language=en`
    );
    
    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }
    
    const data: any = await response.json();
    console.log('🌍 Geocoding response:', data);
    
    // Extract city and country from the response
    const results = data.results?.[0];
    if (!results) {
      throw new Error('No geocoding results found');
    }
    
    const city = results.city || results.name || 'Unknown';
    const country = results.country || 'Unknown';
    const countryCode = results.country_code?.toUpperCase() || 'XX';
    
    console.log('✅ Location detected:', { city, country, countryCode });
    
    return { city, country, countryCode };
  } catch (error) {
    console.error('❌ Reverse geocoding error:', error);
    // Fallback if geocoding fails
    return {
      city: 'Current Location',
      country: 'Unknown',
      countryCode: 'XX'
    };
  }
}

/**
 * Request location permission and detect user location
 * Shows a user-friendly message about why we need their location
 */
export async function requestLocationPermission(): Promise<UserLocation | null> {
  try {
    console.log('📍 Requesting location permission...');
    const location = await detectUserLocation();
    
    if (location.error) {
      console.warn('⚠️ Location detection had issues:', location.error);
    }
    
    return location;
  } catch (error) {
    console.error('❌ Location permission error:', error);
    return null;
  }
}

/**
 * Format location data for display
 */
export function formatLocation(location: UserLocation): string {
  if (location.error) {
    return `${location.city}, ${location.country} (location detection in progress)`;
  }
  return `${location.city}, ${location.country}`;
}

/**
 * Check if we have valid location data
 */
export function isValidLocation(location: UserLocation): boolean {
  return (
    location.latitude !== 0 &&
    location.longitude !== 0 &&
    location.country !== 'Unknown' &&
    location.city !== 'Unknown' &&
    !location.error
  );
}
