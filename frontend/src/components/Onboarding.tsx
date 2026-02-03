import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Heart, DollarSign, Users, Calendar, Plane } from 'lucide-react';
import type { User } from '../lib/auth';
import { apiClient } from '../lib/api';

interface OnboardingProps {
  user: User;
  onComplete: () => void;
}

export default function Onboarding({ user, onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    name: user.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    travelStyle: '',
    favoriteDestinations: '',
    budgetRange: '',
    travelFrequency: '',
    travelCompanions: '',
    interests: [] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const questions = [
    {
      title: "Welcome! Let's get to know you better 👋",
      subtitle: "First, what should we call you?",
      field: 'name',
      type: 'text',
      icon: Users,
      placeholder: 'Enter your name',
    },
    {
      title: "What's your travel style?",
      subtitle: "This helps us personalize your experience",
      field: 'travelStyle',
      type: 'choice',
      icon: Plane,
      options: [
        { value: 'luxury', label: '✨ Luxury & Comfort', desc: 'Premium stays and experiences' },
        { value: 'adventure', label: '🏔️ Adventure Seeker', desc: 'Thrills and exploration' },
        { value: 'budget', label: '💰 Budget Traveler', desc: 'Best value for money' },
        { value: 'cultural', label: '🎭 Cultural Explorer', desc: 'Museums, history, local culture' },
        { value: 'relaxation', label: '🌴 Relaxation', desc: 'Beach resorts and spa retreats' },
      ],
    },
    {
      title: "What's your typical travel budget?",
      subtitle: "We'll find the best options in your range",
      field: 'budgetRange',
      type: 'choice',
      icon: DollarSign,
      options: [
        { value: 'budget', label: '💵 Budget', desc: 'Under $50/day' },
        { value: 'moderate', label: '💳 Moderate', desc: '$50-150/day' },
        { value: 'premium', label: '💎 Premium', desc: '$150-300/day' },
        { value: 'luxury', label: '👑 Luxury', desc: 'Above $300/day' },
      ],
    },
    {
      title: "How often do you travel?",
      subtitle: "Help us understand your wanderlust level",
      field: 'travelFrequency',
      type: 'choice',
      icon: Calendar,
      options: [
        { value: 'frequent', label: '✈️ Frequent Flyer', desc: 'Monthly or more' },
        { value: 'regular', label: '🗓️ Regular Traveler', desc: 'Every few months' },
        { value: 'occasional', label: '🎒 Occasional', desc: '2-3 times a year' },
        { value: 'rare', label: '🌟 Special Occasions', desc: 'Once a year or less' },
      ],
    },
    {
      title: "Who do you usually travel with?",
      subtitle: "This helps us suggest suitable accommodations",
      field: 'travelCompanions',
      type: 'choice',
      icon: Users,
      options: [
        { value: 'solo', label: '🚶 Solo Traveler', desc: 'I explore alone' },
        { value: 'partner', label: '💑 Partner/Spouse', desc: 'Romantic getaways' },
        { value: 'family', label: '👨‍👩‍👧‍👦 Family', desc: 'With kids or relatives' },
        { value: 'friends', label: '👥 Friends', desc: 'Group adventures' },
      ],
    },
    {
      title: "What interests you most?",
      subtitle: "Select all that apply",
      field: 'interests',
      type: 'multiple',
      icon: Heart,
      options: [
        { value: 'beaches', label: '🏖️ Beaches' },
        { value: 'mountains', label: '⛰️ Mountains' },
        { value: 'cities', label: '🏙️ Cities' },
        { value: 'food', label: '🍜 Food & Cuisine' },
        { value: 'history', label: '🏛️ History' },
        { value: 'nature', label: '🌲 Nature & Wildlife' },
        { value: 'shopping', label: '🛍️ Shopping' },
        { value: 'nightlife', label: '🎉 Nightlife' },
      ],
    },
  ];

  const currentQuestion = questions[step];

  const handleNext = async () => {
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      await handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      console.log('Saving user preferences...');
      // Save all preferences to database
      const prefs = await apiClient.saveUserPreferences(user.id, {
        userName: formData.name,
        locationCity: '',
        locationCountry: '',
        locationLat: 0,
        locationLon: 0,
      });
      console.log('Preferences saved:', prefs);

      console.log('Saving onboarding bookmark...');
      // Save additional onboarding data as a bookmark/note
      await apiClient.saveBookmark(user.id, 'preferences', {
        travelStyle: formData.travelStyle,
        favoriteDestinations: formData.favoriteDestinations,
        budgetRange: formData.budgetRange,
        travelFrequency: formData.travelFrequency,
        travelCompanions: formData.travelCompanions,
        interests: formData.interests,
      }, 'User onboarding preferences');
      
      console.log('Onboarding complete! Reloading...');
      // Small delay to ensure data is committed
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Reload the page to refresh preferences
      window.location.reload();
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      alert('Failed to save onboarding data. Please check the console and try again.');
      setIsSubmitting(false);
    }
  };

  const isStepValid = () => {
    const field = currentQuestion.field as keyof typeof formData;
    const value = formData[field];
    
    if (currentQuestion.type === 'multiple') {
      return Array.isArray(value) && value.length > 0;
    }
    return value && value.toString().trim().length > 0;
  };

  const handleInputChange = (value: string) => {
    setFormData({ ...formData, [currentQuestion.field]: value });
  };

  const handleMultipleChoice = (value: string) => {
    const current = formData.interests;
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    setFormData({ ...formData, interests: updated });
  };

  const Icon = currentQuestion.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-slate-600">Step {step + 1} of {questions.length}</span>
            <span className="text-sm text-slate-600">{Math.round(((step + 1) / questions.length) * 100)}%</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
              initial={{ width: 0 }}
              animate={{ width: `${((step + 1) / questions.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-3xl shadow-xl p-8 md:p-12"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white">
                <Icon size={28} />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-slate-800">{currentQuestion.title}</h2>
                <p className="text-slate-600 mt-1">{currentQuestion.subtitle}</p>
              </div>
            </div>

            <div className="mt-8">
              {currentQuestion.type === 'text' && (
                <input
                  type="text"
                  value={formData[currentQuestion.field as keyof typeof formData] as string}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder={currentQuestion.placeholder}
                  className="w-full px-6 py-4 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:outline-none text-lg"
                  autoFocus
                />
              )}

              {currentQuestion.type === 'choice' && (
                <div className="space-y-3">
                  {currentQuestion.options?.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleInputChange(option.value)}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                        formData[currentQuestion.field as keyof typeof formData] === option.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-semibold text-slate-800">{option.label}</div>
                      {'desc' in option && option.desc && <div className="text-sm text-slate-600 mt-1">{option.desc}</div>}
                    </button>
                  ))}
                </div>
              )}

              {currentQuestion.type === 'multiple' && (
                <div className="grid grid-cols-2 gap-3">
                  {currentQuestion.options?.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleMultipleChoice(option.value)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        formData.interests.includes(option.value)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-semibold text-slate-800 text-center">{option.label}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-8 border-t border-slate-200">
              <button
                onClick={handleBack}
                disabled={step === 0}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-0 disabled:pointer-events-none"
              >
                <ChevronLeft size={20} />
                Back
              </button>
              <button
                onClick={handleNext}
                disabled={!isStepValid() || isSubmitting}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  'Saving...'
                ) : step === questions.length - 1 ? (
                  'Complete'
                ) : (
                  <>
                    Next
                    <ChevronRight size={20} />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
