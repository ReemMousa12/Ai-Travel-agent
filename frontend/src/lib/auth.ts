import { createClient } from '@supabase/supabase-js';

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
    return supabase.auth.signInWithPassword({ email, password });
  },

  async signUp(email: string, password: string) {
    return supabase.auth.signUp({ email, password });
  },

  async signOut() {
    return supabase.auth.signOut();
  },
};
