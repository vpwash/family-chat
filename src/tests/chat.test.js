import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Chat from '../components/Chat';

// Mock the supabase client
jest.mock('../lib/supabase', () => {
  const mockChannel = {
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn().mockReturnThis(),
    unsubscribe: jest.fn(),
  };
  
  return {
    auth: {
      getUser: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    channel: jest.fn().mockReturnValue(mockChannel),
    removeChannel: jest.fn(),
  };
});

describe('Chat Component', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    user_metadata: { full_name: 'Test User' }
  };

  const mockMessages = [
    {
      id: 1,
      content: 'Hello, world!',
      user_id: 'user-123',
      user_email: 'test@example.com',
      user_name: 'Test User',
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      content: 'Hi there!',
      user_id: 'user-456',
      user_email: 'other@example.com',
      user_name: 'Other User',
      created_at: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Mock getUser to return a user
    supabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    
    // Mock the messages query
    supabase.from().select().order.mockResolvedValue({
      data: mockMessages,
      error: null,
    });
    
    // Mock the insert operation
    supabase.from().insert.mockResolvedValue({
      data: [{ id: 3 }],
      error: null,
    });
    
    // Mock the channel subscription
    const mockChannel = supabase.channel();
    mockChannel.on.mockImplementation((event, callback) => {
      if (event === 'postgres_changes') {
        // Simulate a new message being received
        setTimeout(() => {
          callback({
            new: {
              id: 3,
              content: 'New message!',
              user_id: 'user-789',
              user_email: 'new@example.com',
              user_name: 'New User',
              created_at: new Date().toISOString(),
            },
          });
        }, 100);
      }
      return mockChannel;
    });
  });

  it('loads and displays messages', async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/chat']}>
          <Routes>
            <Route path="/chat" element={<Chat />} />
          </Routes>
        </MemoryRouter>
      );
    });

    // Check if messages are loaded
    expect(await screen.findByText('Hello, world!')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
    
    // Check if the subscription was set up
    expect(supabase.channel).toHaveBeenCalledWith('messages');
    expect(supabase.channel().on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.any(Object),
      expect.any(Function)
    );
    expect(supabase.channel().subscribe).toHaveBeenCalled();
  });

  it('allows sending a new message', async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/chat']}>
          <Routes>
            <Route path="/chat" element={<Chat />} />
          </Routes>
        </MemoryRouter>
      );
    });

    // Enter a new message
    const input = screen.getByPlaceholderText('Type a message...');
    fireEvent.change(input, { target: { value: 'Test message' } });
    
    // Submit the form
    const sendButton = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendButton);
    
    // Check if the message was sent
    await waitFor(() => {
      expect(supabase.from().insert).toHaveBeenCalledWith([
        {
          content: 'Test message',
          user_id: 'user-123',
          user_email: 'test@example.com',
          user_name: 'Test User',
        },
      ]);
    });
  });

  it('displays new messages in real-time', async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/chat']}>
          <Routes>
            <Route path="/chat" element={<Chat />} />
          </Routes>
        </MemoryRouter>
      );
    });
    
    // Wait for the new message to appear
    expect(await screen.findByText('New message!')).toBeInTheDocument();
  });

  it('allows signing out', async () => {
    const mockNavigate = jest.fn();
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate,
    }));
    
    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/chat']}>
          <Routes>
            <Route path="/chat" element={<Chat />} />
          </Routes>
        </MemoryRouter>
      );
    });
    
    // Click the sign out button
    const signOutButton = screen.getByRole('button', { name: /sign out/i });
    fireEvent.click(signOutButton);
    
    // Check if signOut was called
    await waitFor(() => {
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });
  });

  it('redirects to login if not authenticated', async () => {
    // Mock no user being authenticated
    supabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });
    
    const mockNavigate = jest.fn();
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate,
    }));
    
    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/chat']}>
          <Routes>
            <Route path="/chat" element={<Chat />} />
          </Routes>
        </MemoryRouter>
      );
    });
    
    // Check if navigation to login occurred
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });
});
