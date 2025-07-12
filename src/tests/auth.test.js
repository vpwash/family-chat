import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Auth } from '@supabase/auth-ui-react';
import { supabase } from '../lib/supabase';
import AuthComponent from '../components/Auth';

// Mock the supabase client
jest.mock('../lib/supabase', () => ({
  auth: {
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
  },
}));

describe('Authentication', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Mock the onAuthStateChange callback
    supabase.auth.onAuthStateChange.mockImplementation((callback) => {
      // Simulate auth state change with a session
      callback('SIGNED_IN', { session: { user: { id: '123', email: 'test@example.com' } } });
      
      // Return the unsubscribe function
      return { data: { subscription: { unsubscribe: jest.fn() } } };
    });
  });

  it('renders the auth form', () => {
    render(
      <MemoryRouter>
        <AuthComponent />
      </MemoryRouter>
    );
    
    expect(screen.getByText('Family Chat')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('allows users to sign in', async () => {
    // Mock successful sign in
    supabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: { id: '123', email: 'test@example.com' } },
      error: null,
    });

    render(
      <MemoryRouter>
        <AuthComponent />
      </MemoryRouter>
    );

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Check if signInWithPassword was called with the correct credentials
    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('shows error message on failed sign in', async () => {
    // Mock failed sign in
    const errorMessage = 'Invalid login credentials';
    supabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: null },
      error: { message: errorMessage },
    });

    render(
      <MemoryRouter>
        <AuthComponent />
      </MemoryRouter>
    );

    // Fill in the form with invalid credentials
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'wrong@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpassword' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('allows users to sign up', async () => {
    // Mock successful sign up
    supabase.auth.signUp.mockResolvedValueOnce({
      data: { user: { id: '123', email: 'new@example.com' } },
      error: null,
    });

    render(
      <MemoryRouter>
        <AuthComponent />
      </MemoryRouter>
    );

    // Switch to sign up view
    fireEvent.click(screen.getByText(/sign up/i));

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'new@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'newpassword123' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    // Check if signUp was called with the correct credentials
    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'newpassword123',
      });
    });
  });
});
