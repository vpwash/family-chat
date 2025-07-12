import { createClient } from '@supabase/supabase-js';

// Get environment variables with fallbacks for both Vite and direct env access
const getEnvVar = (key) => {
  // First try import.meta.env (works in Vite)
  if (import.meta.env[`VITE_${key}`]) {
    return import.meta.env[`VITE_${key}`];
  }
  // Then try process.env (works in Node.js during build)
  if (process.env[`VITE_${key}`]) {
    return process.env[`VITE_${key}`];
  }
  // Check if it's defined in the global scope (for production)
  if (window.env && window.env[`VITE_${key}`]) {
    return window.env[`VITE_${key}`];
  }
  return '';
};

const supabaseUrl = getEnvVar('SUPABASE_URL');
const supabaseAnonKey = getEnvVar('SUPABASE_ANON_KEY');

// Log the environment for debugging
console.log('Environment:', {
  isProduction: import.meta.env.PROD,
  supabaseUrl: supabaseUrl ? '***URL SET***' : 'MISSING',
  supabaseAnonKey: supabaseAnonKey ? '***KEY SET***' : 'MISSING'
});

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration. Please check your environment variables.');
  if (!supabaseUrl) console.error('VITE_SUPABASE_URL is not set');
  if (!supabaseAnonKey) console.error('VITE_SUPABASE_ANON_KEY is not set');
}

// Create Supabase client with configuration
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : null
  },
  realtime: {
    eventsPerSecond: 10
  }
});

// Export the configured client
export { supabase };
