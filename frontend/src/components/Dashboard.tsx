import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Cloud, Wind, Droplets, RefreshCw, Plane, Hotel, Calendar } from 'lucide-react';
import type { User } from '../lib/auth';
import { apiClient } from '../lib/api';
import type { WeatherData } from '../lib/api';
import DestinationShowcase from './DestinationShowcase';

interface DashboardProps {
  user: User;
}

export default function Dashboard({ user }: DashboardProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [location, setLocation] = useState('Loading...');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, [user]);

  async function loadDashboard() {
    try {
      // Check for saved preferences (may be null if database not deployed)
      const preferences = await apiClient.getUserPreferences(user.id);
      
      let city = 'London';
      let locationSet = false;
      
      if (preferences?.locationCity) {
        city = preferences.locationCity;
        setLocation(`${preferences.locationCity}, ${preferences.locationCountry}`);
        locationSet = true;
      }
      
      // If no saved preferences, try to detect location
      if (!locationSet) {
        try {
          const locationData = await apiClient.getLocation();
          if (!locationData?.error && locationData?.city) {
            city = locationData.city;
            setLocation(`${locationData.city}, ${locationData.country}`);
            
            // Save detected location (if backend is working)
            await apiClient.saveUserPreferences(user.id, {
              locationCity: locationData.city,
              locationCountry: locationData.country,
              locationLat: locationData.latitude,
              locationLon: locationData.longitude,
            }).catch(() => {
              console.warn('Could not save preferences - database may not be deployed');
            });
          } else {
            setLocation('London, UK');
          }
        } catch (locationError) {
          console.warn('Location detection failed:', locationError);
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
      await apiClient.deleteUserPreferences(user.id);
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
            </div>
            <button
              onClick={updateLocation}
              disabled={loading}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors disabled:opacity-50"
              title="Update Location"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

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
        <DestinationShowcase />
      </motion.div>
    </div>
  );
}
