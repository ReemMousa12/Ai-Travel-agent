import { useState, useEffect } from 'react';
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
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, [userId]);

  async function requestLocationPermission() {
    setLoading(true);
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            console.log('🟢 GPS CALLBACK STARTED');
            const { latitude, longitude } = position.coords;
            console.log('📍 Location permission granted:', { latitude, longitude });
            console.log('🔑 userId available?', userId);
            console.log('🔑 apiClient available?', !!apiClient);
            
            try {
              console.log('🌐 Starting reverse geocoding...');
              // Reverse geocode to get city/country
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
              );
              const data = await response.json();
              console.log('🌐 Geocoding response:', data);
              
              const city = data.address?.city || data.address?.town || 'Your Location';
              const country = data.address?.country_code?.toUpperCase() || 'EG';
              console.log('📍 Extracted city/country:', { city, country });
              
              setLocation(`${city}, ${country}`);
              setShowLocationPrompt(false);
              
              // Save to database - BOTH tables
              console.log('💾 Saving location to database:', { userId, city, country, lat: latitude, lon: longitude });
              
              try {
                // Save to user_preferences
                console.log('📤 Saving to user_preferences...');
                const prefResult = await apiClient.saveUserPreferences(userId, {
                  locationCity: city,
                  locationCountry: country,
                  locationLat: latitude,
                  locationLon: longitude,
                });
                console.log('✅ user_preferences saved:', prefResult);
              } catch (prefErr) {
                console.error('❌ user_preferences save failed:', prefErr);
              }
              
              try {
                // Save to user_profiles
                console.log('📤 Saving to user_profiles...');
                const profileResult = await apiClient.saveDetectedLocation(userId, {
                  locationCity: city,
                  locationCountry: country,
                  latitude: latitude,
                  longitude: longitude,
                });
                console.log('✅ user_profiles saved:', profileResult);
              } catch (profileErr) {
                console.error('❌ user_profiles save failed:', profileErr);
              }
            } catch (error) {
              console.error('❌ Reverse geocoding error:', error);
              if (error instanceof Error) {
                console.error('Error details:', error.message);
              }
            } finally {
              console.log('✅ GPS callback completed');
              setLoading(false);
            }
          },
          () => {
            console.log('📍 Location permission denied');
            setPermissionDenied(true);
            setShowLocationPrompt(false);
            setLoading(false);
            loadDashboard(); // Fall back to IP-based or saved location
          }
        );
      }
    } catch (error) {
      console.error('Location request error:', error);
      setLoading(false);
    }
  }

  async function loadDashboard() {
    try {
      // Check for saved preferences (may be null if database not deployed)
      const preferences = await apiClient.getUserPreferences(userId);
      console.log('📦 Preferences loaded:', preferences);
      
      let city = 'London';
      let locationSet = false;
      
      if (preferences?.locationCity) {
        console.log('✓ Saved location found in user_preferences');
        city = preferences.locationCity;
        setLocation(`${preferences.locationCity}, ${preferences.locationCountry}`);
        locationSet = true;
      } else {
        console.log('ℹ️ No saved location in user_preferences, will detect...');
      }
      
      // If no saved preferences, try to detect location
      if (!locationSet) {
        console.log('🟡 ENTERING DETECTION BLOCK (locationSet = false)');
        try {
          console.log('🔍 No saved location, detecting from IP/GPS...');
          const locationData = await apiClient.getLocation();
          console.log('📍 Location data received:', locationData);
          console.log('🔎 Checking condition:', {
            error: locationData?.error,
            city: locationData?.city,
            conditionResult: !locationData?.error && locationData?.city
          });
          
          if (!locationData?.error && locationData?.city) {
            console.log('🟢 ENTERING SAVE BLOCK - Condition passed');
            console.log('   locationData.error:', locationData?.error);
            console.log('   locationData.city:', locationData?.city);
            city = locationData.city;
            setLocation(`${locationData.city}, ${locationData.country}`);
            
            // Save detected location to both tables
            console.log('💾 Attempting to save detected location to both tables...');
            console.log('   userId:', userId);
            console.log('   locationCity:', locationData.city);
            console.log('   locationCountry:', locationData.country);
            
            try {
              // Save to user_preferences
              console.log('📤 Saving to user_preferences...');
              const prefResult = await apiClient.saveUserPreferences(userId, {
                locationCity: locationData.city,
                locationCountry: locationData.country,
                locationLat: locationData.latitude,
                locationLon: locationData.longitude,
              });
              console.log('✅ user_preferences saved:', prefResult);
            } catch (prefErr) {
              console.error('❌ user_preferences save failed:', prefErr);
            }
            
            try {
              // Save to user_profiles (current location)
              console.log('📤 Saving to user_profiles...');
              const profileResult = await apiClient.saveDetectedLocation(userId, {
                locationCity: locationData.city,
                locationCountry: locationData.country,
                latitude: locationData.latitude,
                longitude: locationData.longitude,
              });
              console.log('✅ user_profiles saved:', profileResult);
            } catch (profileErr) {
              console.error('❌ user_profiles save failed:', profileErr);
            }
          } else {
            console.warn('⚠️ Invalid location data:', locationData);
            setLocation('London, UK');
          }
        } catch (locationError) {
          console.error('❌ Location detection failed:', locationError);
          setLocation('London, UK');
        }
      }
      
      // Load weather
      const weatherData = await apiClient.getWeather(city);
      setWeather(weatherData);
    } catch (error) {
      console.error('Dashboard error:', error);
      setLocation('London, UK');
    } finally {
      setLoading(false);
    }
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
      {/* Hero Section */}
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
              <p className="text-sm mb-3 text-white/90">
                📍 Allow access to your precise location for better travel recommendations?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={requestLocationPermission}
                  disabled={loading}
                  className="flex-1 bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Detecting...' : 'Allow'}
                </button>
                <button
                  onClick={() => setShowLocationPrompt(false)}
                  className="flex-1 bg-white/20 text-white px-4 py-2 rounded-lg font-semibold hover:bg-white/30 transition-colors"
                >
                  Skip
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
