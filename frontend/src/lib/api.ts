// API Configuration
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

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
    const response = await fetch(`${API_BASE_URL}/api/travel/location`);
    return response.json();
  }

  async getTrendingData(location: string): Promise<TrendingData> {
    const response = await fetch(
      `${API_BASE_URL}/api/travel/trending?location=${encodeURIComponent(location)}`
    );
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  }

  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    const response = await fetch(
      `${API_BASE_URL}/api/database/user-preferences?userId=${userId}`
    );
    const result = await response.json();
    return result.data;
  }

  async saveUserPreferences(userId: string, preferences: UserPreferences) {
    const response = await fetch(`${API_BASE_URL}/api/database/user-preferences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, preferences }),
    });
    const result = await response.json();
    return result.data;
  }

  async deleteUserPreferences(userId: string) {
    const response = await fetch(
      `${API_BASE_URL}/api/database/user-preferences?userId=${userId}`,
      { method: 'DELETE' }
    );
    return response.json();
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
}

export const apiClient = new ApiClient();
