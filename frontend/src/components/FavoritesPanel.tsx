import React, { useState, useEffect } from 'react';
import { Heart, MapPin, Star, Plus } from 'lucide-react';
import type { Favorite } from '../lib/api';
import { apiClient } from '../lib/api';
import { FavoritesList } from './FavoritesList';

interface FavoritesPanelProps {
  userId: string;
}

export const FavoritesPanel: React.FC<FavoritesPanelProps> = ({ userId }) => {
  const [showList, setShowList] = useState(false);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    visited: 0,
    wishlist: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, [userId]);

  const loadFavorites = async () => {
    setLoading(true);
    const data = await apiClient.getFavorites(userId);
    setFavorites(data);
    setStats({
      total: data.length,
      visited: data.filter((f) => f.visited).length,
      wishlist: data.filter((f) => !f.visited).length,
    });
    setLoading(false);
  };

  if (showList) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Heart className="w-6 h-6 text-red-600" />
            My Favorites
          </h2>
          <button
            onClick={() => setShowList(false)}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium transition-colors"
          >
            Back
          </button>
        </div>
        <FavoritesList userId={userId} onRemove={() => loadFavorites()} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Heart className="w-6 h-6 text-red-600" />
          Favorites
        </h2>
        <button
          onClick={() => setShowList(true)}
          className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          View All
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Favorites</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.visited}</div>
          <div className="text-sm text-gray-600">Visited</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.wishlist}</div>
          <div className="text-sm text-gray-600">Wishlist</div>
        </div>
      </div>

      {/* Recent Favorites Preview */}
      {!loading && favorites.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-700">Recent Favorites</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {favorites.slice(0, 5).map((favorite) => (
              <div
                key={favorite.id}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                {favorite.image_url && (
                  <img
                    src={favorite.image_url}
                    alt={favorite.destination}
                    className="w-12 h-12 rounded object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-800 truncate">
                    {favorite.destination}
                  </h4>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <MapPin className="w-3 h-3" />
                    {favorite.country}
                  </div>
                  {favorite.rating && (
                    <div className="flex items-center gap-1 text-sm text-yellow-600 mt-1">
                      <Star className="w-3 h-3 fill-current" />
                      {favorite.rating}
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0">
                  {favorite.visited ? (
                    <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-1 rounded">
                      ✓ Visited
                    </span>
                  ) : (
                    <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      Wishlist
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {favorites.length > 5 && (
            <button
              onClick={() => setShowList(true)}
              className="w-full mt-3 py-2 text-center text-blue-600 hover:text-blue-700 font-semibold transition-colors"
            >
              View all {favorites.length} favorites →
            </button>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && favorites.length === 0 && (
        <div className="text-center py-8">
          <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No favorites yet</p>
          <p className="text-sm text-gray-400">Start exploring and save your favorite destinations!</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading favorites...</p>
        </div>
      )}
    </div>
  );
};
