import { createClient } from '@supabase/supabase-js';
import { requestLocationPermission } from './location';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export interface User {
  id: string;
  email: string;
}

/**
 * Save user's detected location to the database
 */
async function saveLocationToDatabase(userId: string, location: any): Promise<void> {
  try {
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://ai-travel-agent-backend.vercel.app';
    console.log('📍 Saving location to database:', { userId, location });
    
    const response = await fetch(`${apiUrl}/api/database/user-preferences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        preferences: {
          locationCity: location.city,
          locationCountry: location.country,
          locationLat: location.latitude,
          locationLon: location.longitude
        }
      })
    });
    
    const result = await response.json();
    if (result.success) {
      console.log('✅ Location saved to database:', result.data);
    } else {
      console.warn('⚠️ Failed to save location:', result.message);
    }
  } catch (error) {
    console.error('❌ Error saving location to database:', error);
  }
}

export const auth = {
  async getUser(): Promise<User | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      // If there's a session error (expired token, etc), try to get the current user
      if (error || !session) {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          // Session invalid - user needs to log in again
          await supabase.auth.signOut();
          return null;
        }
        return { id: user.id, email: user.email || '' };
      }
      
      return session?.user ? { id: session.user.id, email: session.user.email || '' } : null;
    } catch (error) {
      console.error('Auth error:', error);
      return null;
    }
  },

  async signIn(email: string, password: string) {
    const result = await supabase.auth.signInWithPassword({ email, password });
    
    // Detect and save location after successful sign in
    if (result.data?.user?.id) {
      try {
        console.log('📍 Detecting location after sign in...');
        const location = await requestLocationPermission();
        if (location && location.city !== 'Unknown') {
          await saveLocationToDatabase(result.data.user.id, location);
        }
      } catch (error) {
        console.warn('⚠️ Could not auto-detect location on login:', error);
        // Don't fail login if location detection fails
      }
    }
    
    return result;
  },

  async signUp(email: string, password: string) {
    const result = await supabase.auth.signUp({ email, password });
    
    // Create user profile and detect location after signup
    if (result.data?.user?.id) {
      try {
        const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://ai-travel-agent-backend.vercel.app';
        const response = await fetch(`${apiUrl}/api/database/create-profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: result.data.user.id,
            email: email,
            name: email.split('@')[0]
          })
        });
        const profileResult = await response.json();
        console.log('👤 Profile creation response:', { 
          success: profileResult.success, 
          message: profileResult.message 
        });
        
        // Detect and save location after profile creation
        console.log('📍 Detecting location during sign up...');
        const location = await requestLocationPermission();
        if (location && location.city !== 'Unknown') {
          await saveLocationToDatabase(result.data.user.id, location);
        }
      } catch (error) {
        console.error('⚠️ Error during signup flow:', error);
        // Don't fail signup if profile creation or location detection fails
      }
    }
    
    return result;
  },

  async signOut() {
    return supabase.auth.signOut();
  },
};
