import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and Anon Key from environment variables
const getEnvVar = (key) => {
  // First try Vite's import.meta.env
  if (import.meta.env[`VITE_${key}`]) {
    return import.meta.env[`VITE_${key}`];
  }
  // Then try window.env (injected by Vite)
  if (window.env && window.env[`VITE_${key}`]) {
    return window.env[`VITE_${key}`];
  }
  console.error(`Missing required environment variable: VITE_${key}`);
  return '';
};

const supabaseUrl = getEnvVar('SUPABASE_URL');
const supabaseAnonKey = getEnvVar('SUPABASE_ANON_KEY');

// Log the environment for debugging
console.log('Initializing Supabase with URL:', 
  supabaseUrl ? '***URL SET***' : 'MISSING URL',
  'Key:', 
  supabaseAnonKey ? '***KEY SET***' : 'MISSING KEY'
);

let supabase;

try {
  // Initialize Supabase client
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: window.localStorage
    },
    realtime: {
      eventsPerSecond: 10
    }
  });

  // Test the connection
  supabase.auth.getSession()
    .then(({ data: { session } }) => {
      console.log('Supabase connected successfully');
      if (session) {
        console.log('User session:', session.user.email);
      }
    })
    .catch(error => {
      console.error('Supabase connection test failed:', error);
    });
} catch (error) {
  console.error('Failed to initialize Supabase:', error);
  
  // Create a mock client to prevent app from crashing
  supabase = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null })
        }),
        insert: () => Promise.resolve({ data: null, error: 'Supabase not initialized' })
      })
    })
  };
}

export { supabase };
