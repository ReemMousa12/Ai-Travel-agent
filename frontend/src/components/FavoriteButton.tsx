import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { apiClient } from '../lib/api';

interface FavoriteButtonProps {
  userId: string;
  destination: string;
  country: string;
  onToggle?: (isFavorited: boolean) => void;
  className?: string;
  showText?: boolean;
  type?: 'destination' | 'hotel' | 'activity' | 'flight';
  imageUrl?: string;
  rating?: number;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  userId,
  destination,
  country,
  onToggle,
  className = '',
  showText = false,
  type = 'destination',
  imageUrl,
  rating,
}) => {
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);

  useEffect(() => {
    checkIfFavorited();
  }, [userId, destination]);

  const checkIfFavorited = async () => {
    const favorites = await apiClient.getFavorites(userId);
    const existing = favorites.find(
      (fav) => fav.destination.toLowerCase() === destination.toLowerCase() && fav.country === country
    );
    setIsFavorited(!!existing);
    setFavoriteId(existing?.id || null);
  };

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('FavoriteButton clicked', { userId, destination, country, isFavorited, loading });
    
    if (!userId) {
      console.warn('No userId provided to FavoriteButton');
      return;
    }

    setLoading(true);

    try {
      if (isFavorited && favoriteId) {
        console.log('Removing favorite:', favoriteId);
        const success = await apiClient.removeFavorite(favoriteId, userId);
        console.log('Remove result:', success);
        setIsFavorited(false);
        setFavoriteId(null);
        onToggle?.(false);
      } else {
        console.log('Adding favorite:', { destination, country });
        const favorite = await apiClient.addFavorite(userId, destination, country, {
          type,
          imageUrl,
          rating,
        });
        console.log('Add result:', favorite);
        
        // Consider it successful even if favorite object is null, as long as the insert didn't error
        if (favorite || favorite === null) {
          // Re-check if it was actually added
          await checkIfFavorited();
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
        isFavorited
          ? 'bg-red-100 text-red-600 hover:bg-red-200'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      } disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart
        className={`w-5 h-5 transition-all ${
          isFavorited ? 'fill-current' : 'hover:fill-current'
        }`}
      />
      {showText && (
        <span className="text-sm font-medium">
          {isFavorited ? 'Favorited' : 'Add to Favorites'}
        </span>
      )}
    </button>
  );
};
