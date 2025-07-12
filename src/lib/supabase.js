import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
    // Force a specific realtime version that matches the server
    version: '1.0.0',
  },
  global: {
    headers: {
      'X-Client-Info': 'family-chat/1.0.0',
    },
  },
});

// Log the Supabase client version and configuration
console.log('Supabase client initialized with configuration:', {
  url: supabaseUrl,
  version: supabase.supabaseKey,
  realtimeConfig: supabase.realtime
});

// Log the current realtime configuration
console.log('Supabase Realtime client initialized');

// Log initial connection state
console.log('Supabase client ready');

// The realtime connection will be managed by the individual components
// that need it, such as the Chat component
