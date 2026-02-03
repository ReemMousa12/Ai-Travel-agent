import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hnwwggdikfatowcplwct.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhud3dnZ2Rpa2ZhdG93Y3Bsd2N0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNDM1MzYsImV4cCI6MjA4NTYxOTUzNn0.i9z7awX2XM4Q0Xr7Nmjpvceg7FZR7shR4bo2zeMVe_k';

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
