import React, { useState, useEffect } from 'react';
import { User, Mail, Home, MapPin, FileText, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiClient } from '../lib/api';

interface ProfileProps {
  user: {
    id: string;
    email: string;
  };
}

export default function Profile({ user }: ProfileProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: user.email,
    homeCity: '',
    homeCountry: '',
    currentLocation: '',
    currentCountry: '',
    bio: '',
  });

  useEffect(() => {
    loadProfile();
  }, [user.id]);

  async function loadProfile() {
    try {
      setLoading(true);
      const profile = await apiClient.getUserProfile(user.id);
      
      if (profile) {
        setFormData({
          name: profile.name || '',
          email: profile.email || user.email,
          homeCity: profile.home_city || '',
          homeCountry: profile.home_country || '',
          currentLocation: profile.current_location || '',
          currentCountry: profile.current_country || '',
          bio: profile.bio || '',
        });
        console.log('✅ Profile loaded:', profile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setMessage('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      setSaving(true);
      setMessage('');
      
      const result = await apiClient.updateUserProfile(user.id, {
        name: formData.name,
        bio: formData.bio,
        homeCity: formData.homeCity,
        homeCountry: formData.homeCountry,
      });
      
      if (result) {
        setMessage('✅ Profile updated successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('❌ Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage('❌ Error saving profile');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass rounded-3xl p-8 text-center bg-gradient-to-r from-primary-500 to-secondary-500"
      >
        <h1 className="text-4xl font-bold text-white mb-2">Your Profile</h1>
        <p className="text-white/90">Manage your personal information and preferences</p>
      </motion.div>

      {/* Message Alert */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg ${
            message.includes('✅')
              ? 'bg-green-100 text-green-700 border border-green-300'
              : 'bg-red-100 text-red-700 border border-red-300'
          }`}
        >
          {message}
        </motion.div>
      )}

      {/* Profile Form */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass rounded-2xl p-8"
      >
        <form onSubmit={handleSave} className="space-y-6">
          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-modern pl-10"
                placeholder="Enter your full name"
              />
            </div>
          </div>

          {/* Email Field (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="email"
                value={formData.email}
                disabled
                className="input-modern pl-10 bg-slate-100 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
          </div>

          {/* Current Location (Auto-detected) */}
          <div className="glass rounded-lg p-4 bg-blue-50 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="text-blue-600" size={18} />
              <span className="font-semibold text-blue-900">Current Location (Auto-Detected)</span>
            </div>
            <p className="text-sm text-blue-700">
              {formData.currentLocation && formData.currentCountry
                ? `${formData.currentLocation}, ${formData.currentCountry}`
                : 'Location not yet detected'}
            </p>
          </div>

          {/* Divider */}
          <hr className="border-slate-200" />

          {/* Home City */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Home City</label>
            <div className="relative">
              <Home className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                value={formData.homeCity}
                onChange={(e) => setFormData({ ...formData, homeCity: e.target.value })}
                className="input-modern pl-10"
                placeholder="e.g., Cairo"
              />
            </div>
          </div>

          {/* Home Country */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Home Country</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                value={formData.homeCountry}
                onChange={(e) => setFormData({ ...formData, homeCountry: e.target.value })}
                className="input-modern pl-10"
                placeholder="e.g., Egypt"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Bio</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 text-slate-400" size={20} />
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="input-modern pl-10 resize-none"
                rows={4}
                placeholder="Tell us about yourself and your travel interests..."
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">{formData.bio.length}/500 characters</p>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={saving}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={20} />
                Save Profile
              </>
            )}
          </button>
        </form>
      </motion.div>

      {/* Info Card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass rounded-2xl p-6 bg-slate-50"
      >
        <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <FileText size={18} />
          Profile Information
        </h3>
        <ul className="space-y-2 text-sm text-slate-600">
          <li>✓ Your home city and country help us suggest relevant destinations</li>
          <li>✓ Current location is automatically detected from your device</li>
          <li>✓ Your bio is visible to other travelers when sharing trips</li>
          <li>✓ Email is your unique identifier and cannot be changed</li>
        </ul>
      </motion.div>
    </div>
  );
}
