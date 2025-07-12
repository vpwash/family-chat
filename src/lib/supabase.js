import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Enhanced Supabase client configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    debug: process.env.NODE_ENV === 'development',
  },
  realtime: {
    eventsPerSecond: 10,
    // Use WebSocket by default with fallback to long polling
    transport: 'websocket',
    // Auto-reconnect with exponential backoff
    reconnect: {
      maxAttempts: 5,
      minDelay: 1000, // 1 second
      maxDelay: 5000, // 5 seconds
    },
    // Force a specific realtime version
    version: '1.0.0',
  },
  global: {
    headers: {
      'X-Client-Info': 'family-chat/1.0.0',
    },
  },
});

// Add error handling for WebSocket connection
supabase.realtime.onError((error) => {
  console.error('Supabase Realtime error:', error);
});

// Add connection state change listener
supabase.realtime.onStatusChange((status) => {
  console.log('Supabase Realtime status:', status);
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
