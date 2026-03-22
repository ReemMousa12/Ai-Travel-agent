// API Configuration
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

// Log API configuration on module load for debugging
if (typeof window !== 'undefined') {
  console.log('API Configuration:', { 
    API_BASE_URL,
    VITE_BACKEND_URL: import.meta.env.VITE_BACKEND_URL
  });
}

// Types
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface Trip {
  id?: number;
  trip_name?: string;
  destination: string;
  start_date: string;
  end_date: string;
  budget?: number;
  travelers?: number;
  notes?: string;
  created_at?: string;
}

export interface UserPreferences {
  userName?: string;
  locationCity: string;
  locationCountry: string;
  locationLat: number;
  locationLon: number;
}

export interface WeatherData {
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
  };
  weather: Array<{
    description: string;
    icon: string;
  }>;
  wind: {
    speed: number;
  };
  cod?: string | number;
}

export interface LocationData {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  error?: string;
  reason?: string;
}

export interface Destination {
  name: string;
  image: string;
  price: number;
  rating: number;
  desc: string;
}

export interface Deal {
  name: string;
  location: string;
  image: string;
  price: number;
  oldPrice: number;
  rating: number;
  reviews: number;
}

export interface Favorite {
  id?: string;
  user_id: string;
  destination: string;
  country: string;
  type?: 'destination' | 'hotel' | 'activity' | 'flight';
  reason?: string;
  description?: string;
  image_url?: string;
  notes?: string;
  price_estimate?: number;
  rating?: number;
  visited?: boolean;
  visit_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TrendingData {
  destinations: Destination[];
  deals: Deal[];
}

// API Client
class ApiClient {
  async sendChatMessage(message: string, userId: string, userName?: string) {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, userId, userName }),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  }

  async getWeather(location: string): Promise<WeatherData> {
    const response = await fetch(
      `${API_BASE_URL}/api/travel/weather?location=${encodeURIComponent(location)}`
    );
    return response.json();
  }

  async getLocation(): Promise<LocationData> {
    try {
      // Try browser Geolocation API first (most accurate)
      if (navigator.geolocation) {
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              try {
                // Reverse geocode coordinates to get city/country
                const { latitude, longitude } = position.coords
                const response = await fetch(
                  `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                )
                const data = await response.json()
                
                resolve({
                  city: data.address?.city || data.address?.town || 'Your Location',
                  country: data.address?.country_code?.toUpperCase() || 'EG',
                  latitude,
                  longitude,
                  error: undefined
                })
              } catch (error) {
                // Fallback to IP-based if reverse geocoding fails
                this.fallbackLocationDetection().then(resolve)
              }
            },
            async () => {
              // User denied permission, fall back to IP-based
              const result = await this.fallbackLocationDetection()
              resolve(result)
            },
            { timeout: 5000, enableHighAccuracy: true }
          )
        })
      }
      
      // No geolocation support, use IP-based
      return this.fallbackLocationDetection()
    } catch (error) {
      console.error('Location error:', error)
      return this.fallbackLocationDetection()
    }
  }

  private async fallbackLocationDetection(): Promise<LocationData> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/travel/location`)
      return response.json()
    } catch (error) {
      console.error('Fallback location error:', error)
      return {
        city: 'Cairo',
        country: 'EG',
        latitude: 30.0444,
        longitude: 31.2357,
        error: 'Could not detect location'
      }
    }
  }

  async getTrendingData(location: string): Promise<TrendingData> {
    const response = await fetch(
      `${API_BASE_URL}/api/travel/trending?location=${encodeURIComponent(location)}`
    );
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  }

  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/database/user-preferences?userId=${userId}`
      );
      if (!response.ok) {
        console.warn(`Failed to fetch preferences: ${response.status}`);
        return null;
      }
      const result = await response.json();
      return result.data || null;
    } catch (error) {
      console.warn('Error fetching preferences:', error);
      return null;
    }
  }

  async saveUserPreferences(userId: string, preferences: UserPreferences) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/database/user-preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, preferences }),
      });
      if (!response.ok) {
        console.warn(`Failed to save preferences: ${response.status}`);
        return null;
      }
      const result = await response.json();
      return result.data || null;
    } catch (error) {
      console.warn('Error saving preferences:', error);
      return null;
    }
  }

  async deleteUserPreferences(userId: string) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/database/user-preferences?userId=${userId}`,
        { method: 'DELETE' }
      );
      return response.json();
    } catch (error) {
      console.warn('Error deleting preferences:', error);
      return { success: false };
    }
  }

  async getSavedTrips(userId: string): Promise<Trip[]> {
    const response = await fetch(`${API_BASE_URL}/api/database/trips?userId=${userId}`);
    const result = await response.json();
    return result.data || [];
  }

  async saveTrip(userId: string, tripData: Partial<Trip>) {
    const response = await fetch(`${API_BASE_URL}/api/database/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, tripData }),
    });
    const result = await response.json();
    return result.data;
  }

  async deleteTrip(tripId: number) {
    const response = await fetch(
      `${API_BASE_URL}/api/database/trips/${tripId}`,
      { method: 'DELETE' }
    );
    return response.json();
  }

  async getChatHistory(userId: string, sessionId?: string): Promise<ChatMessage[]> {
    const url = sessionId 
      ? `${API_BASE_URL}/api/database/chat-history?userId=${userId}&sessionId=${sessionId}`
      : `${API_BASE_URL}/api/database/chat-history?userId=${userId}`;
    const response = await fetch(url);
    const result = await response.json();
    return result.data || [];
  }

  async saveChatMessage(userId: string, role: string, content: string, sessionId?: string) {
    const response = await fetch(`${API_BASE_URL}/api/database/chat-history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role, content, sessionId }),
    });
    return response.json();
  }

  async clearChatHistory(userId: string, sessionId?: string) {
    const url = sessionId 
      ? `${API_BASE_URL}/api/database/chat-history?userId=${userId}&sessionId=${sessionId}`
      : `${API_BASE_URL}/api/database/chat-history?userId=${userId}`;
    const response = await fetch(url, { method: 'DELETE' });
    return response.json();
  }

  async getSearchHistory(userId: string, type?: string) {
    const url = type 
      ? `${API_BASE_URL}/api/database/search-history?userId=${userId}&type=${type}`
      : `${API_BASE_URL}/api/database/search-history?userId=${userId}`;
    const response = await fetch(url);
    const result = await response.json();
    return result.data || [];
  }

  async saveSearchHistory(userId: string, searchType: string, searchQuery: any, resultsCount?: number) {
    const response = await fetch(`${API_BASE_URL}/api/database/search-history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, searchType, searchQuery, resultsCount }),
    });
    return response.json();
  }

  async getBookmarks(userId: string) {
    const response = await fetch(`${API_BASE_URL}/api/database/bookmarks?userId=${userId}`);
    const result = await response.json();
    return result.data || [];
  }

  async saveBookmark(userId: string, itemType: string, itemData: any, notes?: string) {
    const response = await fetch(`${API_BASE_URL}/api/database/bookmarks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, itemType, itemData, notes }),
    });
    return response.json();
  }

  async deleteBookmark(bookmarkId: string, userId: string) {
    const response = await fetch(
      `${API_BASE_URL}/api/database/bookmarks/${bookmarkId}?userId=${userId}`,
      { method: 'DELETE' }
    );
    return response.json();
  }

  // ===== FAVORITES METHODS =====

  async addFavorite(
    userId: string,
    destination: string,
    country: string,
    options?: {
      type?: 'destination' | 'hotel' | 'activity' | 'flight';
      reason?: string;
      description?: string;
      imageUrl?: string;
      priceEstimate?: number;
      rating?: number;
    }
  ): Promise<Favorite | null> {
    try {
      const url = `${API_BASE_URL}/api/favorites`;
      const body = {
        userId,
        destination,
        country,
        type: options?.type || 'destination',
        reason: options?.reason,
        description: options?.description,
        imageUrl: options?.imageUrl,
        priceEstimate: options?.priceEstimate,
        rating: options?.rating,
      };
      console.log('addFavorite request:', { url, body });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      const result = await response.json();
      console.log('addFavorite response:', { 
        status: response.status, 
        result,
        hasFavorite: !!result.favorite,
        keys: Object.keys(result)
      });
      
      // Log backend debug info if available
      if (result._debug && Array.isArray(result._debug)) {
        console.log('=== BACKEND DEBUG INFO ===');
        result._debug.forEach((msg: string, i: number) => console.log(`[${i}] ${msg}`));
        console.log('=========================');
      }
      
      if (!response.ok) {
        console.warn('addFavorite failed:', response.status, result);
      }
      
      return result.favorite || null;
    } catch (error) {
      console.warn('Error adding favorite:', error);
      return null;
    }
  }

  async removeFavorite(favoriteId: string, userId: string): Promise<boolean> {
    try {
      const url = `${API_BASE_URL}/api/favorites/${favoriteId}?userId=${userId}`;
      console.log('removeFavorite request:', { url });
      
      const response = await fetch(url, { method: 'DELETE' });
      const result = await response.json();
      
      console.log('removeFavorite response:', { status: response.status, result });
      
      return result.success || false;
    } catch (error) {
      console.warn('Error removing favorite:', error);
      return false;
    }
  }

  async getFavorites(userId: string, limit?: number, offset?: number): Promise<Favorite[]> {
    try {
      const url = new URL(`${API_BASE_URL}/api/favorites`);
      url.searchParams.append('userId', userId);
      if (limit) url.searchParams.append('limit', limit.toString());
      if (offset) url.searchParams.append('offset', offset.toString());

      console.log('getFavorites request:', { url: url.toString() });
      
      const response = await fetch(url.toString());
      const result = await response.json();
      
      console.log('getFavorites response:', { status: response.status, result });
      
      return result.favorites || [];
    } catch (error) {
      console.warn('Error fetching favorites:', error);
      return [];
    }
  }

  async updateFavorite(
    favoriteId: string,
    userId: string,
    updates: {
      visited?: boolean;
      visitDate?: string;
      notes?: string;
      reason?: string;
    }
  ): Promise<Favorite | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/favorites/${favoriteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          visited: updates.visited,
          visitDate: updates.visitDate,
          notes: updates.notes,
          reason: updates.reason,
        }),
      });
      const result = await response.json();
      return result.favorite || null;
    } catch (error) {
      console.warn('Error updating favorite:', error);
      return null;
    }
  }

  async filterFavorites(
    userId: string,
    filters?: {
      type?: string;
      reason?: string;
      visited?: boolean;
    }
  ): Promise<Favorite[]> {
    try {
      const url = new URL(`${API_BASE_URL}/api/favorites/filter`);
      url.searchParams.append('userId', userId);
      if (filters?.type) url.searchParams.append('type', filters.type);
      if (filters?.reason) url.searchParams.append('reason', filters.reason);
      if (filters?.visited !== undefined) url.searchParams.append('visited', filters.visited.toString());

      const response = await fetch(url.toString());
      const result = await response.json();
      return result.favorites || [];
    } catch (error) {
      console.warn('Error filtering favorites:', error);
      return [];
    }
  }
}

export const apiClient = new ApiClient();
