import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let client;
export const SUPABASE_ENABLED = !!(supabaseUrl && supabaseAnonKey);

try {
  if (!SUPABASE_ENABLED) throw new Error('Missing Supabase URL or anon key');
  client = createClient(supabaseUrl, supabaseAnonKey);
} catch (err) {
  console.error('[Supabase] Initialization failed:', err.message);
  // Provide a minimal stub to avoid crashes when auth is referenced
  client = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: async () => ({ data: null, error: new Error('Auth disabled') }),
      signUp: async () => ({ data: null, error: new Error('Auth disabled') }),
      signOut: async () => ({ error: null }),
      signInWithOtp: async () => ({ error: new Error('Auth disabled') }),
      resetPasswordForEmail: async () => ({ error: new Error('Auth disabled') }),
      signInWithOAuth: async () => ({ error: new Error('Auth disabled') })
    },
    from: () => ({ select: async () => ({ data: null, error: new Error('DB disabled') }) })
  };
}

export const supabase = client;
