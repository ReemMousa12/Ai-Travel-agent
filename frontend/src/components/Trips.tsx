import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, MapPin, Calendar, DollarSign, X } from 'lucide-react';
import type { User } from '../lib/auth';
import { apiClient } from '../lib/api';
import type { Trip } from '../lib/api';
import { formatDate } from '../lib/utils';

interface TripsProps {
  user: User;
}

export default function Trips({ user }: TripsProps) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newTrip, setNewTrip] = useState({
    destination: '',
    startDate: '',
    endDate: '',
    budget: '',
    notes: '',
  });

  useEffect(() => {
    loadTrips();
  }, [user]);

  async function loadTrips() {
    try {
      const data = await apiClient.getSavedTrips(user.id);
      setTrips(data);
    } catch (error) {
      console.error('Load trips error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddTrip(e: React.FormEvent) {
    e.preventDefault();
    if (!newTrip.destination || !newTrip.startDate || !newTrip.endDate) return;

    try {
      await apiClient.saveTrip(user.id, {
        destination: newTrip.destination,
        start_date: newTrip.startDate,
        end_date: newTrip.endDate,
        budget: newTrip.budget ? parseFloat(newTrip.budget) : undefined,
        notes: newTrip.notes || undefined,
      });

      setShowModal(false);
      setNewTrip({ destination: '', startDate: '', endDate: '', budget: '', notes: '' });
      loadTrips();
    } catch (error) {
      console.error('Add trip error:', error);
    }
  }

  async function handleDeleteTrip(tripId: number) {
    if (!confirm('Are you sure you want to delete this trip?')) return;

    try {
      await apiClient.deleteTrip(tripId);
      setTrips(trips.filter(t => t.id !== tripId));
    } catch (error) {
      console.error('Delete trip error:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">My Trips</h2>
          <p className="text-slate-600 mt-1">
            {trips.length} {trips.length === 1 ? 'trip' : 'trips'} planned
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowModal(true)}
          className="btn-primary px-6 py-3 rounded-xl flex items-center gap-2"
        >
          <Plus size={20} />
          Add Trip
        </motion.button>
      </div>

      {/* Trips Grid */}
      {trips.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card text-center py-16"
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center mx-auto mb-6">
            <MapPin size={48} className="text-primary-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">No trips yet</h3>
          <p className="text-slate-600 mb-6">Start planning your next adventure!</p>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary px-8 py-3 rounded-xl"
          >
            Create Your First Trip
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {trips.map((trip, index) => (
              <motion.div
                key={trip.id}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="card group cursor-pointer relative overflow-hidden"
              >
                {/* Delete Button */}
                <button
                  onClick={() => handleDeleteTrip(trip.id!)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                  title="Delete trip"
                >
                  <Trash2 size={16} />
                </button>

                {/* Gradient Header */}
                <div className="h-32 bg-gradient-to-br from-primary-500 via-secondary-500 to-pink-500 -m-6 mb-4 flex items-center justify-center">
                  <MapPin size={48} className="text-white opacity-80" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-slate-800 mb-4">{trip.destination}</h3>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar size={18} />
                    <span className="text-sm">
                      {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                    </span>
                  </div>

                  {trip.budget && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <DollarSign size={18} />
                      <span className="text-sm font-semibold">${trip.budget}</span>
                    </div>
                  )}

                  {trip.notes && (
                    <p className="text-sm text-slate-600 line-clamp-2 mt-3 pt-3 border-t border-slate-200">
                      {trip.notes}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add Trip Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setShowModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="glass rounded-3xl max-w-lg w-full p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-slate-800">Add New Trip</h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 rounded-full hover:bg-slate-200 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleAddTrip} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Destination *
                    </label>
                    <input
                      type="text"
                      value={newTrip.destination}
                      onChange={(e) => setNewTrip({ ...newTrip, destination: e.target.value })}
                      placeholder="Paris, France"
                      required
                      className="input-modern w-full"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        value={newTrip.startDate}
                        onChange={(e) => setNewTrip({ ...newTrip, startDate: e.target.value })}
                        required
                        className="input-modern w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        End Date *
                      </label>
                      <input
                        type="date"
                        value={newTrip.endDate}
                        onChange={(e) => setNewTrip({ ...newTrip, endDate: e.target.value })}
                        required
                        className="input-modern w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Budget (optional)
                    </label>
                    <input
                      type="number"
                      value={newTrip.budget}
                      onChange={(e) => setNewTrip({ ...newTrip, budget: e.target.value })}
                      placeholder="1500"
                      min="0"
                      step="0.01"
                      className="input-modern w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Notes (optional)
                    </label>
                    <textarea
                      value={newTrip.notes}
                      onChange={(e) => setNewTrip({ ...newTrip, notes: e.target.value })}
                      placeholder="Add any notes about your trip..."
                      rows={3}
                      className="input-modern w-full resize-none"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 px-6 py-3 rounded-xl border-2 border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 btn-primary px-6 py-3 rounded-xl"
                    >
                      Add Trip
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
