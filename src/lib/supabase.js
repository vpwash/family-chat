import { createClient } from '@supabase/supabase-js';

// Directly use environment variables - they will be replaced during build
const supabaseUrl = 'https://eappkkxvdtfrhoupmcxy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhcHBra3h2ZHRmcmhvdXBtY3h5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4NTEzNTIsImV4cCI6MjA2NzQyNzM1Mn0.GOp7y2yE2S97de1ZyoBN5CZ4t_FmxfHCyq3GrTFcrb4';

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
