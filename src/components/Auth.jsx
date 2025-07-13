import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../lib/supabase';
import { Box, Container, Typography } from '@mui/material';

export default function AuthComponent() {
  const [session, setSession] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        navigate('/chat');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (!session) {
    return (
      <Container component="main" maxWidth="xs">
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography component="h1" variant="h5" gutterBottom>
            Family Chat
          </Typography>
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={['google', 'facebook']}
            socialLayout="horizontal"
            redirectTo={window.location.origin}
            view="sign_in"
            showLinks={false}
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Email',
                  password_label: 'Your Password',
                  email_input_placeholder: 'Your email address',
                  password_input_placeholder: 'Your password',
                  button_label: 'Sign in',
                  loading_button_label: 'Signing in ...',
                  social_provider_text: 'Sign in with {{provider}}',
                  link_text: 'New user? Sign ups are currently by invitation only',
                },
              },
            }}
          />
          <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 2 }}>
            Don't have an account? Please contact the administrator for access.
          </Typography>
        </Box>
      </Container>
    );
  }

  return null;
}
