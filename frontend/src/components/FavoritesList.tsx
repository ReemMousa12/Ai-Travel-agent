import React, { useState, useEffect } from 'react';
import { Heart, MapPin, Star, Trash2, CheckCircle, Clock } from 'lucide-react';
import type { Favorite } from '../lib/api';
import { apiClient } from '../lib/api';

interface FavoritesListProps {
  userId: string;
  onRemove?: (favoriteId: string) => void;
}

export const FavoritesList: React.FC<FavoritesListProps> = ({ userId, onRemove }) => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filteredFavorites, setFilteredFavorites] = useState<Favorite[]>([]);

  useEffect(() => {
    loadFavorites();
  }, [userId]);

  useEffect(() => {
    applyFilter();
  }, [favorites, filterType]);

  const loadFavorites = async () => {
    setLoading(true);
    const data = await apiClient.getFavorites(userId);
    setFavorites(data);
    setLoading(false);
  };

  const applyFilter = () => {
    if (filterType === 'all') {
      setFilteredFavorites(favorites);
    } else if (filterType === 'visited') {
      setFilteredFavorites(favorites.filter((fav) => fav.visited));
    } else if (filterType === 'wishlist') {
      setFilteredFavorites(favorites.filter((fav) => !fav.visited));
    } else {
      setFilteredFavorites(favorites.filter((fav) => fav.type === filterType));
    }
  };

  const handleRemove = async (favoriteId: string) => {
    if (await apiClient.removeFavorite(favoriteId, userId)) {
      setFavorites(favorites.filter((fav) => fav.id !== favoriteId));
      onRemove?.(favoriteId);
    }
  };

  const handleMarkVisited = async (favorite: Favorite) => {
    const updated = await apiClient.updateFavorite(favorite.id!, userId, {
      visited: !favorite.visited,
      visitDate: !favorite.visited ? new Date().toISOString().split('T')[0] : undefined,
    });
    if (updated) {
      setFavorites(
        favorites.map((fav) => (fav.id === favorite.id ? { ...fav, ...updated } : fav))
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading favorites...</div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="text-center p-8">
        <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700">No favorites yet</h3>
        <p className="text-gray-500">Start adding your favorite destinations!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'destination', 'hotel', 'activity', 'flight', 'wishlist', 'visited'].map(
          (tab) => (
            <button
              key={tab}
              onClick={() => setFilterType(tab)}
              className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-colors ${
                filterType === tab
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          )
        )}
      </div>

      {/* Favorites Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFavorites.map((favorite) => (
          <div
            key={favorite.id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            {/* Image */}
            {favorite.image_url && (
              <div className="relative h-40 bg-gray-200 overflow-hidden">
                <img
                  src={favorite.image_url}
                  alt={favorite.destination}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  {favorite.visited && (
                    <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Visited
                    </span>
                  )}
                  {favorite.rating && (
                    <span className="bg-yellow-500 text-white px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      {favorite.rating}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Content */}
            <div className="p-4">
              {/* Title and Location */}
              <h3 className="font-bold text-lg text-gray-800 mb-1">{favorite.destination}</h3>
              <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
                <MapPin className="w-4 h-4" />
                {favorite.country}
              </div>

              {/* Type Badge */}
              <div className="mb-3">
                <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">
                  {favorite.type || 'destination'}
                </span>
              </div>

              {/* Reason and Description */}
              {favorite.reason && (
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Reason:</strong> {favorite.reason}
                </p>
              )}
              {favorite.description && (
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{favorite.description}</p>
              )}

              {/* Price and Visit Info */}
              <div className="border-t pt-3 space-y-2">
                {favorite.price_estimate && (
                  <div className="text-sm">
                    <strong className="text-gray-700">Est. Price:</strong>{' '}
                    <span className="text-green-600 font-semibold">${favorite.price_estimate}</span>
                  </div>
                )}
                {favorite.visit_date && favorite.visited && (
                  <div className="text-sm text-gray-600 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Visited: {new Date(favorite.visit_date).toLocaleDateString()}
                  </div>
                )}
                {favorite.notes && (
                  <div className="text-sm">
                    <strong className="text-gray-700">Notes:</strong> {favorite.notes}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4 pt-3 border-t">
                <button
                  onClick={() => handleMarkVisited(favorite)}
                  className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-1 justify-center ${
                    favorite.visited
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  {favorite.visited ? 'Visited' : 'Mark Visited'}
                </button>
                <button
                  onClick={() => handleRemove(favorite.id!)}
                  className="px-3 py-2 rounded text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors flex items-center gap-1 justify-center"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty Filter Result */}
      {filteredFavorites.length === 0 && (
        <div className="text-center p-8">
          <p className="text-gray-500">No favorites found in this category</p>
        </div>
      )}
    </div>
  );
};
