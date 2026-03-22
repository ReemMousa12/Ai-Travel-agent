import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, MapPin } from 'lucide-react';
import { auth } from '../lib/auth';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [locationPrompt, setLocationPrompt] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    setLocationPrompt(false);

    try {
      if (isSignUp) {
        console.log('Starting signup process...');
        const { error: signupError } = await auth.signUp(email, password);
        if (signupError) throw signupError;
        
        // Show location permission info after signup
        setLocationPrompt(true);
        setTimeout(() => {
          alert('Check your email for confirmation link! We\'re also detecting your location to provide personalized travel recommendations.');
          setLocationPrompt(false);
        }, 500);
      } else {
        console.log('Starting sign in process...');
        const { error: signinError } = await auth.signIn(email, password);
        if (signinError) throw signinError;
        
        // Show location permission info after signin
        setLocationPrompt(true);
        setTimeout(() => {
          console.log('Sign in successful, calling onLogin');
          onLogin();
        }, 500);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
      setLocationPrompt(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md"
      >
        <div className="card space-y-6">
          <div className="text-center">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-6xl mb-4 inline-block"
            >
              ✈️
            </motion.div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-slate-600 mt-2">
              Your AI-powered travel companion
            </p>
          </div>

          {/* Location Permission Info */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm flex items-start gap-3"
          >
            <MapPin size={18} className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium mb-1">📍 We'll detect your location</p>
              <p className="text-xs">
                To provide personalized travel recommendations, we'll ask for permission to access your location. This helps us suggest nearby destinations and local information.
              </p>
            </div>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-modern pl-10"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-modern pl-10"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg bg-red-50 text-red-600 text-sm"
              >
                {error}
              </motion.div>
            )}

            {locationPrompt && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg bg-yellow-50 text-yellow-700 text-sm flex items-center gap-2"
              >
                <div className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                Detecting your location...
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={20} />
                  {isSignUp ? 'Sign Up' : 'Sign In'}
                </>
              )}
            </button>
          </form>

          <div className="text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
