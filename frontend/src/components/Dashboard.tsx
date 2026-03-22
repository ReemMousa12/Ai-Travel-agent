import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Cloud, Wind, Droplets, RefreshCw, Plane, Hotel, Calendar } from 'lucide-react';
import { apiClient } from '../lib/api';
import type { WeatherData } from '../lib/api';
import DestinationShowcase from './DestinationShowcase';

interface DashboardProps {
  userId: string;
}

export default function Dashboard({ userId }: DashboardProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [location, setLocation] = useState('Loading...');
  const [loading, setLoading] = useState(true);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false); // Only show if no saved location
  const [permissionDenied, setPermissionDenied] = useState(false);
  const loadedRef = useRef(false); // Prevent duplicate loads

  useEffect(() => {
    console.log('🔄 Dashboard useEffect triggered for userId:', userId);
    
    // Prevent double loading in React Strict Mode
    if (loadedRef.current) {
      console.log('⚠️ Dashboard already loaded, skipping');
      return;
    }
    
    loadedRef.current = true;
    loadDashboard();
  }, [userId]);

  async function loadDashboard() {
    try {
      console.log('📊 [loadDashboard] Starting...');
      setLoading(true);
      
      // STEP 1: Check for saved preferences
      console.log('📊 [Step 1] Checking saved preferences...');
      const preferences = await apiClient.getUserPreferences(userId);
      console.log('📦 [Step 1] Preferences:', preferences);
      
      if (preferences?.locationCity) {
        console.log('✅ [Step 1] Found saved location:', preferences.locationCity);
        setLocation(`${preferences.locationCity}, ${preferences.locationCountry}`);
        const weatherData = await apiClient.getWeather(preferences.locationCity);
        setWeather(weatherData);
        setLoading(false);
        return;
      }
      
      // STEP 2: No saved location, try GPS
      console.log('📊 [Step 2] No saved location, attempting GPS...');
      const gpsLocation = await tryGPSDetection();
      
      if (gpsLocation) {
        console.log('✅ [Step 2] GPS succeeded:', gpsLocation);
        setLocation(`${gpsLocation.city}, ${gpsLocation.country}`);
        const weatherData = await apiClient.getWeather(gpsLocation.city);
        setWeather(weatherData);
        setLoading(false);
        return;
      }
      
      // STEP 3: GPS denied/failed, try IP detection
      console.log('📊 [Step 3] GPS failed, trying IP detection...');
      const ipLocation = await apiClient.getLocation();
      console.log('📊 [Step 3] IP detection result:', ipLocation);
      
      if (ipLocation?.city && ipLocation.city !== 'London') {
        console.log('✅ [Step 3] IP detection succeeded:', ipLocation.city);
        setLocation(`${ipLocation.city}, ${ipLocation.country}`);
        const weatherData = await apiClient.getWeather(ipLocation.city);
        setWeather(weatherData);
      } else {
        console.log('⚠️ [Step 3] IP detection returned London (fallback)');
        setLocation('London, GB');
        setShowLocationPrompt(true); // Show GPS button as option
        const weatherData = await apiClient.getWeather('London');
        setWeather(weatherData);
      }
    } catch (error) {
      console.error('❌ [loadDashboard] Error:', error);
      setLocation('London, GB');
    } finally {
      setLoading(false);
    }
  }

  async function tryGPSDetection(): Promise<{ city: string; country: string } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.log('❌ Geolocation not supported');
        resolve(null);
        return;
      }

      console.log('📍 Requesting GPS permission...');
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            console.log('🟢 GPS GRANTED - coordinates:', position.coords);
            const { latitude, longitude } = position.coords;

            // Reverse geocode
            console.log('🌐 Reverse geocoding...');
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            console.log('🌐 Geocoding result:', data);

            const city = data.address?.city || data.address?.town || null;
            const country = data.address?.country_code?.toUpperCase() || null;

            if (city && country) {
              console.log('✅ Geocoding succeeded:', { city, country });
              // Save to database
              await apiClient.saveUserPreferences(userId, {
                locationCity: city,
                locationCountry: country,
                locationLat: latitude,
                locationLon: longitude,
              });
              console.log('💾 Saved to database');
              resolve({ city, country });
            } else {
              console.log('❌ Geocoding failed - no city/country');
              resolve(null);
            }
          } catch (error) {
            console.error('❌ GPS geocoding error:', error);
            resolve(null);
          }
        },
        (error) => {
          console.log('🚫 GPS DENIED or ERROR:', error.message);
          setPermissionDenied(true);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }

  async function requestLocationPermission() {
    console.log('🔄 Manual GPS request triggered');
    setLoading(true);
    const gpsLocation = await tryGPSDetection();
    
    if (gpsLocation) {
      setLocation(`${gpsLocation.city}, ${gpsLocation.country}`);
      setShowLocationPrompt(false);
      const weatherData = await apiClient.getWeather(gpsLocation.city);
      setWeather(weatherData);
    } else {
      console.log('GPS still failed after retry');
    }
    setLoading(false);
  }

  async function updateLocation() {
    setLoading(true);
    try {
      await apiClient.deleteUserPreferences(userId);
      await loadDashboard();
    } catch (error) {
      console.error('Update location error:', error);
      setLoading(false);
    }
  }

  const quickActions = [
    { icon: Plane, label: 'Search Flights', color: 'from-blue-500 to-cyan-500' },
    { icon: Hotel, label: 'Find Hotels', color: 'from-purple-500 to-pink-500' },
    { icon: Calendar, label: 'Plan Trip', color: 'from-green-500 to-emerald-500' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* LOCATION SETUP PROMPT - Always visible at top */}
      {showLocationPrompt && (
        <div className="bg-orange-500 text-white rounded-lg p-4 shadow-lg border-2 border-orange-600">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-2">📍 Your Location (GPS Required)</h3>
              <p className="text-sm mb-3">
                All IP-based detection services are blocked. <strong>Click below to use your browser's GPS</strong> to set your actual location.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={requestLocationPermission}
                  disabled={loading}
                  className="bg-white text-orange-600 font-bold px-6 py-2 rounded-lg hover:bg-orange-50 transition-colors disabled:opacity-60"
                >
                  {loading ? '⏳ Detecting...' : '📍 Enable GPS Now'}
                </button>
                <button
                  onClick={() => setShowLocationPrompt(false)}
                  className="bg-orange-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* TEST BOX - if you see this, component is rendering */}
      <div className="bg-red-500 p-4 rounded text-white font-bold text-center">
        🧪 DASHBOARD LOADED (showLocationPrompt = {String(showLocationPrompt)})
      </div>
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass rounded-3xl p-8 text-center bg-gradient-to-r from-primary-500 to-secondary-500"
      >
        <h1 className="text-4xl font-bold text-white mb-3">
          Welcome Back! ✈️
        </h1>
        <p className="text-white/90 text-lg">
          Ready to plan your next adventure?
        </p>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.label}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              className="card p-6 flex flex-col items-center gap-3 hover:shadow-2xl cursor-pointer group"
            >
              <div className={`p-4 rounded-2xl bg-gradient-to-br ${action.color} text-white group-hover:scale-110 transition-transform`}>
                <Icon size={32} />
              </div>
              <span className="font-semibold text-slate-700">{action.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Weather & Location */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="card bg-gradient-to-br from-blue-500 to-purple-500 text-white"
        >
          {/* DEBUG: Show showLocationPrompt state */}
          <div className="bg-yellow-300 text-black p-2 rounded mb-2 text-sm font-bold text-center">
            DEBUG: showLocationPrompt = {String(showLocationPrompt)}
          </div>
          
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold mb-1">Your Location</h3>
              <p className="text-white/80 flex items-center gap-2">
                <MapPin size={18} />
                {location}
              </p>
              {permissionDenied && (
                <p className="text-yellow-200 text-sm mt-2 flex items-center gap-1">
                  ⚠️ Location access denied (using IP-based detection)
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowLocationPrompt(!showLocationPrompt)}
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                title="Update Location with GPS"
              >
                <MapPin size={20} />
              </button>
              <button
                onClick={updateLocation}
                disabled={loading}
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors disabled:opacity-50"
                title="Refresh Location"
              >
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Location Permission Prompt */}
          {showLocationPrompt && (
            <div className="bg-white/20 rounded-lg p-4 mb-4 border border-white/30">
              <p className="text-sm mb-3 text-white/90 font-medium">
                📍 <strong>Enable GPS Location?</strong><br />
                This helps us show accurate local recommendations.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={requestLocationPermission}
                  disabled={loading}
                  className="flex-1 bg-white text-blue-600 px-4 py-3 rounded-lg font-bold hover:bg-blue-50 transition-colors disabled:opacity-50"
                >
                  {loading ? '⏳ Detecting...' : '📍 Enable GPS'}
                </button>
                <button
                  onClick={() => setShowLocationPrompt(false)}
                  className="flex-1 bg-white/20 text-white px-4 py-3 rounded-lg font-semibold hover:bg-white/30 transition-colors"
                >
                  Skip for Now
                </button>
              </div>
            </div>
          )}

          {weather && !loading && weather.main ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-5xl font-bold">{Math.round(weather.main.temp)}°C</div>
                  <div className="text-xl capitalize text-white/90 mt-1">
                    {weather.weather[0]?.description || 'Clear'}
                  </div>
                </div>
                <Cloud size={64} className="opacity-80" />
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
                <div className="flex items-center gap-2">
                  <Wind size={20} className="opacity-80" />
                  <div>
                    <div className="text-sm opacity-80">Wind</div>
                    <div className="font-semibold">{weather.wind?.speed || 0} m/s</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Droplets size={20} className="opacity-80" />
                  <div>
                    <div className="text-sm opacity-80">Humidity</div>
                    <div className="font-semibold">{weather.main.humidity}%</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
            </div>
          )}
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="card space-y-4"
        >
          <h3 className="text-xl font-bold text-slate-800">Travel Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Saved Trips', value: '0', color: 'text-primary-600' },
              { label: 'Countries', value: '0', color: 'text-secondary-600' },
              { label: 'Budget Saved', value: '$0', color: 'text-green-600' },
              { label: 'Next Trip', value: 'Plan one!', color: 'text-orange-600' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100"
              >
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-sm text-slate-600 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Trending Destinations Section */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-8"
      >
        <DestinationShowcase userId={userId} />
      </motion.div>
    </div>
  );
}
