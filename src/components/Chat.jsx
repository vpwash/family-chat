import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import EmojiPicker from 'emoji-picker-react';
import { 
  Box, 
  ClickAwayListener,
  Container, 
  TextField, 
  Button, 
  List, 
  ListItem, 
  ListItemText, 
  Typography, 
  Avatar, 
  Divider, 
  IconButton,
  AppBar,
  Toolbar,
  Tooltip,
  Popover
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import QuestionAnswerRoundedIcon from '@mui/icons-material/QuestionAnswerRounded';
import InsertEmoticonIcon from '@mui/icons-material/InsertEmoticon';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const handleProfileClick = () => {
    navigate('/profile');
  };

  useEffect(() => {
    let messagesSubscription;
    
    const setupRealtime = async () => {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          // User not authenticated, redirect to login
          navigate('/');
          return;
        }
        
        setUser(user);
        
        // First, fetch initial messages
        await fetchMessages();
        
        // Set up the real-time subscription
        try {
          // Create a channel with a unique name
          const channelName = `realtime:public:messages:${user.id.slice(0, 8)}`;
          
          // Create a new channel with minimal configuration
          messagesSubscription = supabase
            .channel(channelName)
            .on(
              'postgres_changes',
              {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
              },
              (payload) => {
                setMessages(prev => {
                  const exists = prev.some(msg => msg.id === payload.new.id);
                  return exists ? prev : [...prev, payload.new];
                });
              }
            )
            .on('system', () => {})
            .subscribe((status, err) => {
              if (err) {
                // If new API fails, try the fallback approach
                if (status === 'CHANNEL_ERROR') {
                  setupFallbackSubscription();
                }
                return;
              }
            });
            
        } catch (error) {
          // Try fallback if the primary method fails
          setupFallbackSubscription();
        }
        
        // Fallback subscription method with different configuration
        const setupFallbackSubscription = () => {
          try {
            const fallbackChannel = supabase.channel('fallback-messages-channel')
              .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'messages' },
                (payload) => {
                  if (payload.eventType === 'INSERT') {
                    setMessages(prev => {
                      const exists = prev.some(msg => msg.id === payload.new.id);
                      return exists ? prev : [...prev, payload.new];
                    });
                  }
                }
              )
              .subscribe(() => {});
              
            // Store the fallback subscription for cleanup
            messagesSubscription = fallbackChannel;
            
          } catch (fallbackError) {
            // Fallback subscription failed
          }
        };
        
        // Set up a ping to keep the connection alive
        const pingInterval = setInterval(() => {
          if (messagesSubscription?.state === 'joined') {
            try {
              messagesSubscription.send({ type: 'broadcast', event: 'ping', payload: {} });
            } catch (pingError) {
              console.error('Ping failed:', pingError);
            }
          }
        }, 30000);
        
        // Clean up interval and subscription on unmount
        return () => {
          clearInterval(pingInterval);
          if (messagesSubscription) {
            try {
              supabase.removeChannel(messagesSubscription);
            } catch (e) {
              console.error('Error removing channel:', e);
            }
          }
        };
          
      } catch (error) {
        console.error('Error in setupRealtime:', error);
      }
    };
    
    setupRealtime();
    
    // Cleanup function
    return () => {
      if (messagesSubscription) {
        console.log('Unsubscribing from real-time updates');
        supabase.removeChannel(messagesSubscription);
      }
    };
  }, [navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    console.log('Fetching messages...');
    const { data, error, status } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true });
    
    console.log('Messages fetch status:', status);
    if (error) {
      console.error('Error fetching messages:', error);
    } else {
      console.log('Fetched messages:', data);
      setMessages(data || []);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    const { error } = await supabase
      .from('messages')
      .insert([
        { 
          content: newMessage, 
          user_id: user.id,
          user_email: user.email,
          user_name: user.user_metadata?.full_name || user.email.split('@')[0]
        }
      ]);
    
    if (error) {
      console.error('Error sending message:', error);
    } else {
      setNewMessage('');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Toggle emoji picker
  const toggleEmojiPicker = (event) => {
    setShowEmojiPicker(!showEmojiPicker);
    setEmojiAnchorEl(event.currentTarget);
  };

  // Handle emoji selection
  const onEmojiClick = (emojiData) => {
    const emoji = emojiData.emoji;
    const input = inputRef.current.querySelector('input') || inputRef.current;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    
    setNewMessage(prev => 
      prev.substring(0, start) + emoji + prev.substring(end)
    );
    
    // Move cursor after the inserted emoji
    setTimeout(() => {
      const newPos = start + emoji.length;
      input.setSelectionRange(newPos, newPos);
      input.focus();
    }, 0);
    
    setShowEmojiPicker(false);
  };

  // Close emoji picker when clicking away
  const handleClickAway = () => {
    setShowEmojiPicker(false);
  };

  // Generate a color based on user ID for consistent colors
  const getUserColor = (userId) => {
    if (!userId) return '#4285F4';
    
    // Generate a consistent color from user ID
    const colors = [
      '#4285F4', // Blue
      '#EA4335', // Red
      '#FBBC05', // Yellow
      '#34A853', // Green
      '#673AB7', // Purple
      '#FF6D00', // Orange
      '#00BCD4', // Cyan
      '#9C27B0', // Purple
      '#E91E63', // Pink
      '#009688', // Teal
    ];
    
    // Create a consistent index from userId
    const index = Math.abs(
      userId.split('')
        .reduce((hash, char) => ((hash << 5) - hash) + char.charCodeAt(0), 0)
    ) % colors.length;
    
    return colors[index];
  };
  
  // Get text color that contrasts well with the background
  const getContrastTextColor = (bgColor) => {
    // Convert hex to RGB
    const r = parseInt(bgColor.slice(1, 3), 16);
    const g = parseInt(bgColor.slice(3, 5), 16);
    const b = parseInt(bgColor.slice(5, 7), 16);
    
    // Calculate luminance (perceived brightness)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return black for light colors, white for dark colors
    return luminance > 0.6 ? '#000000' : '#FFFFFF';
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh', 
      bgcolor: 'background.default',
      backgroundImage: 'linear-gradient(120deg, #f6f9fc 0%, #f1f3f4 100%)',
    }}>
      <AppBar 
        position="static" 
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #4285F4 0%, #34A853 100%)',
          color: 'white',
          boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3), 0 2px 6px 2px rgba(60,64,67,0.15)',
        }}
      >
        <Toolbar sx={{ px: { xs: 2, sm: 3 } }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            flexGrow: 1,
            '&:hover': {
              cursor: 'pointer',
            }
          }}>
            <Box sx={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              bgcolor: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2,
              boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            }}>
              <Typography variant="h6" sx={{ 
                color: '#4285F4',
                fontWeight: 700,
                lineHeight: 1,
                fontSize: '1.2rem',
                transform: 'translateY(1px)',
              }}>
                <QuestionAnswerRoundedIcon />
              </Typography>
            </Box>
            <Typography variant="h6" component="div" sx={{ 
              fontWeight: 600,
              fontSize: '1.25rem',
              letterSpacing: '0.01em',
              color: 'white',
            }}>
              Family Chat
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Profile">
              <IconButton 
                onClick={handleProfileClick}
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: 'action.hover',
                  '&:hover': {
                    bgcolor: 'action.selected',
                  },
                }}
              >
                <AccountCircleIcon sx={{ color: 'text.secondary' }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Sign Out">
              <IconButton 
                onClick={handleSignOut}
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: 'action.hover',
                  '&:hover': {
                    bgcolor: 'action.selected',
                  },
                  mr: 1
                }}
              >
                <LogoutIcon sx={{ color: 'text.secondary' }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Box sx={{ 
        flexGrow: 1, 
        overflowY: 'auto',
        overflowX: 'hidden',
        p: { xs: 1, sm: 2 },
        bgcolor: 'background.default',
        // Custom scrollbar styles for WebKit browsers (Chrome, Safari, etc.)
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '4px',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
          },
        },
        // Custom scrollbar styles for Firefox
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(0, 0, 0, 0.2) transparent',
        // Add smooth scrolling for a better user experience
        scrollBehavior: 'smooth',
        // Ensure scrollbar is always visible on large screens
        '@media (min-width: 600px)': {
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-thumb': {
            visibility: 'visible',
          },
        },
      }}>
        <Container maxWidth="md" sx={{ height: '100%' }}>
          <List sx={{ py: 0 }}>
            {messages.map((message, index) => (
              <React.Fragment key={message.id || index}>
                <Box 
                  key={message.id || index}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: message.user_id === user?.id ? 'flex-end' : 'flex-start',
                    mb: 1.5,
                    px: { xs: 1, sm: 2 },
                    '&:hover .message-actions': {
                      opacity: 1,
                    },
                  }}
                >
                  <Box 
                    sx={{
                      display: 'flex',
                      flexDirection: message.user_id === user?.id ? 'row-reverse' : 'row',
                      alignItems: 'flex-start',
                      maxWidth: '85%',
                      width: 'fit-content',
                    }}
                  >
                    {message.user_id !== user?.id && (
                      <Avatar 
                        sx={{ 
                          width: 36,
                          height: 36,
                          mt: 0.5,
                          mr: 1.5,
                          ml: 0.5,
                          bgcolor: getUserColor(message.user_id),
                          color: getContrastTextColor(getUserColor(message.user_id)),
                          fontWeight: 600,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          border: '2px solid white',
                          fontSize: '0.9rem',
                        }}
                      >
                        {message.user_name?.charAt(0).toUpperCase()}
                      </Avatar>
                    )}
                    
                    <Box 
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: message.user_id === user?.id ? 'flex-end' : 'flex-start',
                      }}
                    >
                      {message.user_id !== user?.id && (
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 500,
                            color: 'text.secondary',
                            mb: 0.5,
                            px: 1.5,
                          }}
                        >
                          {message.user_name}
                        </Typography>
                      )}
                      
                      <Box
                        sx={{
                          position: 'relative',
                          bgcolor: message.user_id === user?.id 
                            ? 'primary.main' 
                            : 'background.paper',
                          color: message.user_id === user?.id 
                            ? 'white' 
                            : 'text.primary',
                          borderRadius: 4,
                          px: 2,
                          py: 1.25,
                          boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                          border: message.user_id === user?.id 
                            ? 'none' 
                            : '1px solid rgba(0,0,0,0.08)',
                          borderTopLeftRadius: message.user_id === user?.id ? 16 : 4,
                          borderTopRightRadius: message.user_id === user?.id ? 4 : 16,
                          maxWidth: '100%',
                          wordBreak: 'break-word',
                          whiteSpace: 'pre-wrap',
                          '&:hover': {
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          },
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            lineHeight: 1.4,
                            '& a': {
                              color: message.user_id === user?.id ? '#a8d1ff' : 'primary.main',
                              textDecoration: 'none',
                              '&:hover': {
                                textDecoration: 'underline',
                              },
                            },
                          }}
                          dangerouslySetInnerHTML={{ 
                            __html: message.content.replace(
                              /(https?:\/\/[^\s]+)/g, 
                              '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
                            )
                          }}
                        />
                      </Box>
                      
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          mt: 0.5,
                          px: 1.5,
                          fontSize: '0.7rem',
                          fontWeight: 400,
                        }}
                      >
                        {new Date(message.created_at).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </React.Fragment>
            ))}
            <div ref={messagesEndRef} />
          </List>
        </Container>
      </Box>
      
      <Box 
        component="form" 
        onSubmit={sendMessage} 
        sx={{ 
          p: 2, 
          pt: 1.5,
          borderTop: '1px solid rgba(0,0,0,0.05)',
          background: 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.03)',
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ 
            display: 'flex', 
            gap: 1.5, 
            alignItems: 'center',
            position: 'relative',
          }}>
            <Box sx={{ position: 'relative', width: '100%' }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage(e))}
                size="small"
                inputRef={inputRef}
                InputProps={{
                  sx: {
                    borderRadius: 24,
                    bgcolor: 'white',
                    boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
                    pr: 6,
                    '& fieldset': {
                      borderColor: 'rgba(0,0,0,0.08)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(66,133,244,0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'rgba(66,133,244,0.8)',
                      borderWidth: '1px',
                    },
                    '& input': {
                      py: 1.5,
                      px: 2,
                    },
                  },
                }}
              />
              <IconButton
                onClick={toggleEmojiPicker}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'primary.main',
                    bgcolor: 'transparent',
                  },
                }}
              >
                <InsertEmoticonIcon />
              </IconButton>
              
              {/* Emoji Picker */}
              {showEmojiPicker && (
                <ClickAwayListener onClickAway={handleClickAway}>
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: '60px',
                      right: 0,
                      zIndex: 1300,
                      '& .EmojiPickerReact': {
                        '--epr-emoji-size': '30px',
                        '--epr-category-label-height': '28px',
                        '--epr-category-label-bg-color': 'transparent',
                        '--epr-category-label-text-color': 'text.primary',
                        '--epr-search-input-bg-color': 'background.paper',
                        '--epr-search-input-text-color': 'text.primary',
                        '--epr-bg-color': 'background.paper',
                        '--epr-text-color': 'text.primary',
                        '--epr-category-icon-active-color': 'primary.main',
                        '--epr-emoji-hover-bg-color': 'action.hover',
                        borderRadius: 2,
                        boxShadow: 3,
                        border: '1px solid',
                        borderColor: 'divider',
                        overflow: 'hidden',
                      },
                    }}
                  >
                    <EmojiPicker
                      onEmojiClick={onEmojiClick}
                      autoFocusSearch={false}
                      lazyLoadEmojis={true}
                      width={320}
                      height={380}
                      previewConfig={{
                        showPreview: false,
                      }}
                      searchDisabled={false}
                      skinTonesDisabled
                      defaultSkinTone={1}
                      suggestedEmojisMode="frequent"
                    />
                  </Box>
                </ClickAwayListener>
              )}
            </Box>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={!newMessage.trim()}
              sx={{ 
                minWidth: '44px',
                minHeight: '44px',
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                p: 0,
                background: 'linear-gradient(135deg, #4285F4 0%, #34A853 100%)',
                boxShadow: '0 2px 8px rgba(66,133,244,0.3)',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(66,133,244,0.4)',
                  background: 'linear-gradient(135deg, #4285F4 0%, #34A853 100%)',
                },
                '&:disabled': {
                  background: '#e0e0e0',
                  boxShadow: 'none',
                },
                '& .MuiTouchRipple-root': {
                  color: 'rgba(255,255,255,0.3)',
                },
              }}
            >
              <SendIcon sx={{ fontSize: 20 }} />
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
