
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Lazy initialization to avoid build-time errors
let supabaseInstance: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance;

  if (!supabaseUrl || !supabaseKey) {
    // During build time, return a dummy client that will be replaced at runtime
    if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
      console.warn('Supabase env vars not available during build');
    }
    // For SSR/build, use placeholder - will be properly initialized on client
    return createClient('https://placeholder.supabase.co', 'placeholder-key', {
      auth: { persistSession: false }
    });
  }

  supabaseInstance = createClient(supabaseUrl, supabaseKey, {
    auth: {
      flowType: 'pkce',
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  return supabaseInstance;
}

// Export getter function and a lazy proxy
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return getSupabase()[prop as keyof SupabaseClient];
  }
});
