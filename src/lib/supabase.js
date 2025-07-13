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

// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing required Supabase configuration. ' +
    'Please check your environment variables for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
}

// Log the environment for debugging (without exposing sensitive data)
console.log('Initializing Supabase with URL:', 
  supabaseUrl ? '***URL SET***' : 'MISSING URL',
  'Key:', 
  supabaseAnonKey ? '***KEY SET***' : 'MISSING KEY'
);

let supabaseInstance = null;

/**
 * Get or create the Supabase client instance
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
const getSupabase = () => {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  try {
    // Initialize Supabase client
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: window.localStorage
      },
      realtime: {
        eventsPerSecond: 10
      },
      global: {
        // Ensure fetch is properly bound to the global scope
        fetch: (...args) => fetch(...args)
      }
    });

      // Test the connection
    supabaseInstance.auth.getSession()
      .then(({ data: { session } }) => {
        console.log('Supabase connected successfully');
        if (session) {
          console.log('User session active');
        }
      })
      .catch(error => {
        console.error('Supabase connection test failed:', error);
      });

    return supabaseInstance;
  } catch (error) {
    console.error('Failed to initialize Supabase:', error);
    
    // Create a mock client to prevent app from crashing
    const mockClient = {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: 'Supabase not initialized' }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: () => Promise.resolve({ error: 'Supabase not initialized' }),
        signOut: () => Promise.resolve({ error: 'Supabase not initialized' })
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: 'Supabase not initialized' })
          }),
          insert: () => Promise.resolve({ data: null, error: 'Supabase not initialized' })
        })
      }),
      channel: () => ({
        on: () => ({
          subscribe: () => ({
            unsubscribe: () => {}
          })
        })
      })
    };
    
    // Cache the mock client to prevent repeated initialization
    supabaseInstance = mockClient;
    return mockClient;
  }
};

// Initialize immediately and export the instance
export const supabase = getSupabase();

// Also export the function for cases where a fresh instance is needed
export { getSupabase };
