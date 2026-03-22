import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Star, Trash2, CheckCircle, Clock, Filter } from 'lucide-react';
import type { Favorite } from '../lib/api';
import { apiClient } from '../lib/api';
import type { User } from '../lib/auth';

interface FavoritesPageProps {
  user: User;
}

export default function FavoritesPage({ user }: FavoritesPageProps) {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [filteredFavorites, setFilteredFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'visited' | 'wishlist'>('all');
  const [stats, setStats] = useState({
    total: 0,
    visited: 0,
    wishlist: 0,
  });

  useEffect(() => {
    loadFavorites();
  }, [user.id]);

  useEffect(() => {
    applyFilter();
  }, [favorites, filterType]);

  async function loadFavorites() {
    setLoading(true);
    try {
      const data = await apiClient.getFavorites(user.id);
      setFavorites(data);
      setStats({
        total: data.length,
        visited: data.filter((f) => f.visited).length,
        wishlist: data.filter((f) => !f.visited).length,
      });
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  }

  function applyFilter() {
    let filtered = favorites;
    if (filterType === 'visited') {
      filtered = favorites.filter((fav) => fav.visited);
    } else if (filterType === 'wishlist') {
      filtered = favorites.filter((fav) => !fav.visited);
    }
    setFilteredFavorites(filtered);
  }

  async function handleRemove(favoriteId: string | undefined) {
    if (!favoriteId) return;
    try {
      await apiClient.removeFavorite(favoriteId, user.id);
      setFavorites(favorites.filter((fav) => fav.id !== favoriteId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  }

  async function handleToggleVisited(favoriteId: string | undefined, currentVisited: boolean) {
    if (!favoriteId) return;
    try {
      await apiClient.updateFavorite(favoriteId, user.id, { visited: !currentVisited });
      setFavorites(
        favorites.map((fav) =>
          fav.id === favoriteId ? { ...fav, visited: !currentVisited } : fav
        )
      );
    } catch (error) {
      console.error('Error updating favorite:', error);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="rounded-3xl p-8 text-center bg-gradient-to-r from-red-500 to-pink-500"
      >
        <div className="flex items-center justify-center gap-3 mb-3">
          <Heart className="w-8 h-8 text-white fill-white" />
          <h1 className="text-4xl font-bold text-white">My Favorites</h1>
        </div>
        <p className="text-white/90 text-lg">
          {stats.total} saved destination{stats.total !== 1 ? 's' : ''}
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Saved', value: stats.total, icon: Heart, color: 'from-red-500 to-pink-500' },
          { label: 'Visited', value: stats.visited, icon: CheckCircle, color: 'from-green-500 to-emerald-500' },
          { label: 'Wishlist', value: stats.wishlist, icon: Clock, color: 'from-blue-500 to-cyan-500' },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`rounded-2xl p-6 bg-gradient-to-br ${stat.color} text-white`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <div className="text-white/80 text-sm mt-1">{stat.label}</div>
                </div>
                <Icon size={40} className="opacity-40" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Filter Buttons */}
      {stats.total > 0 && (
        <div className="flex gap-3 flex-wrap">
          {['all', 'visited', 'wishlist'].map((filter) => (
            <button
              key={filter}
              onClick={() => setFilterType(filter as 'all' | 'visited' | 'wishlist')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all ${
                filterType === filter
                  ? 'bg-red-500 text-white shadow-lg'
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-red-500'
              }`}
            >
              <Filter size={18} />
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Favorites Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-12 h-12 border-4 border-red-200 border-t-red-500 rounded-full animate-spin" />
        </div>
      ) : filteredFavorites.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl p-16 text-center bg-white border-2 border-dashed border-gray-300"
        >
          <Heart size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No favorites yet</h3>
          <p className="text-gray-600">
            {stats.total === 0
              ? 'Start by favoriting destinations you love!'
              : `No ${filterType === 'visited' ? 'visited' : 'wishlist'} destinations yet.`}
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFavorites.map((favorite, index) => (
            <motion.div
              key={favorite.id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-2xl overflow-hidden bg-white shadow-lg hover:shadow-2xl transition-shadow"
            >
              {/* Image */}
              {favorite.image_url && (
                <div className="relative h-48 bg-gray-200 overflow-hidden">
                  <img
                    src={favorite.image_url}
                    alt={favorite.destination}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                  <div className="absolute top-3 right-3">
                    <button
                      onClick={() => handleRemove(favorite.id)}
                      className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                  {favorite.visited && (
                    <div className="absolute top-3 left-3 flex items-center gap-1 px-3 py-1 rounded-full bg-green-500 text-white text-sm font-medium">
                      <CheckCircle size={16} />
                      Visited
                    </div>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {favorite.destination}
                </h3>

                {favorite.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {favorite.description}
                  </p>
                )}

                {favorite.price_estimate && (
                  <div className="flex items-center gap-2 text-lg font-semibold text-blue-600 mb-3">
                    💰 ${favorite.price_estimate}
                  </div>
                )}

                {/* Metadata */}
                <div className="space-y-2 mb-4">
                  {favorite.created_at && (
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <Clock size={14} />
                      Saved {new Date(favorite.created_at).toLocaleDateString()}
                    </div>
                  )}
                  {favorite.visit_date && (
                    <div className="text-xs text-green-600 flex items-center gap-2">
                      <CheckCircle size={14} />
                      Visited {new Date(favorite.visit_date).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {/* Rating */}
                {favorite.rating && (
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={i < Math.floor(favorite.rating!) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                      />
                    ))}
                  </div>
                )}

                {/* Action Button */}
                <button
                  onClick={() => handleToggleVisited(favorite.id, favorite.visited ?? false)}
                  className={`w-full py-2 rounded-lg font-medium transition-colors ${
                    favorite.visited
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  {favorite.visited ? 'Mark as Wishlist' : 'Mark as Visited'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
