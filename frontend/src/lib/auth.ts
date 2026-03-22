import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface User {
  id: string;
  email: string;
}

export const auth = {
  async getUser(): Promise<User | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user ? { id: session.user.id, email: session.user.email || '' } : null;
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
