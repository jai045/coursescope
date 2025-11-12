import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let client;
export const SUPABASE_ENV_STATUS = {
  hasUrl: !!supabaseUrl,
  hasAnonKey: !!supabaseAnonKey,
};
export const SUPABASE_ENABLED = SUPABASE_ENV_STATUS.hasUrl && SUPABASE_ENV_STATUS.hasAnonKey;

try {
  if (!SUPABASE_ENABLED) throw new Error('Missing Supabase URL or anon key');
  client = createClient(supabaseUrl, supabaseAnonKey);
} catch (err) {
  console.error('[Supabase] Initialization failed:', err.message, {
    hasUrl: SUPABASE_ENV_STATUS.hasUrl,
    hasAnonKey: SUPABASE_ENV_STATUS.hasAnonKey,
  });
  // Provide a minimal stub to avoid crashes when auth is referenced
  client = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: async () => ({ data: null, error: new Error('Authentication not configured') }),
      signUp: async () => ({ data: null, error: new Error('Authentication not configured') }),
      signOut: async () => ({ error: null }),
      signInWithOtp: async () => ({ error: new Error('Authentication not configured') }),
      resetPasswordForEmail: async () => ({ error: new Error('Authentication not configured') }),
      signInWithOAuth: async () => ({ error: new Error('Authentication not configured') })
    },
    from: () => ({ select: async () => ({ data: null, error: new Error('DB disabled') }) })
  };
}

export const supabase = client;
