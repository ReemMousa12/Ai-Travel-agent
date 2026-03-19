import React, { useState } from 'react';
import { X, Heart, AlertCircle } from 'lucide-react';
import { apiClient } from '../lib/api';

interface AddFavoriteModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (favorite: any) => void;
  prefilledData?: {
    destination?: string;
    country?: string;
    imageUrl?: string;
    type?: 'destination' | 'hotel' | 'activity' | 'flight';
  };
}

export const AddFavoriteModal: React.FC<AddFavoriteModalProps> = ({
  userId,
  isOpen,
  onClose,
  onSuccess,
  prefilledData = {},
}) => {
  const [formData, setFormData] = useState({
    destination: prefilledData.destination || '',
    country: prefilledData.country || '',
    type: prefilledData.type || 'destination',
    reason: '',
    description: '',
    imageUrl: prefilledData.imageUrl || '',
    priceEstimate: '',
    rating: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!formData.destination || !formData.country) {
        setError('Destination and country are required');
        setLoading(false);
        return;
      }

      const favorite = await apiClient.addFavorite(
        userId,
        formData.destination,
        formData.country,
        {
          type: formData.type as any,
          reason: formData.reason || undefined,
          description: formData.description || undefined,
          imageUrl: formData.imageUrl || undefined,
          priceEstimate: formData.priceEstimate ? parseFloat(formData.priceEstimate) : undefined,
          rating: formData.rating ? parseFloat(formData.rating) : undefined,
        }
      );

      if (favorite) {
        onSuccess?.(favorite);
        setFormData({
          destination: '',
          country: '',
          type: 'destination',
          reason: '',
          description: '',
          imageUrl: '',
          priceEstimate: '',
          rating: '',
        });
        onClose();
      } else {
        setError('Failed to add favorite. Please try again.');
      }
    } catch (err) {
      setError('An error occurred while adding the favorite.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Heart className="w-6 h-6 text-red-600" />
            Add to Favorites
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="m-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-96 overflow-y-auto">
          {/* Destination */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Destination *
            </label>
            <input
              type="text"
              name="destination"
              value={formData.destination}
              onChange={handleChange}
              placeholder="e.g., Giza Pyramids"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Country *
            </label>
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleChange}
              placeholder="e.g., Egypt"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="destination">Destination</option>
              <option value="hotel">Hotel</option>
              <option value="activity">Activity</option>
              <option value="flight">Flight</option>
            </select>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason
            </label>
            <input
              type="text"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              placeholder="e.g., Adventure, Relaxation, Culture"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add notes about this place..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              disabled={loading}
            />
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rating (1-5)
            </label>
            <input
              type="number"
              name="rating"
              value={formData.rating}
              onChange={handleChange}
              placeholder="e.g., 4.5"
              min="1"
              max="5"
              step="0.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          {/* Price Estimate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Est. Price ($)
            </label>
            <input
              type="number"
              name="priceEstimate"
              value={formData.priceEstimate}
              onChange={handleChange}
              placeholder="e.g., 50"
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image URL
            </label>
            <input
              type="url"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2 justify-center"
            >
              <Heart className="w-4 h-4" />
              {loading ? 'Adding...' : 'Add Favorite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
