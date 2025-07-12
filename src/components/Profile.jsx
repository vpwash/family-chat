import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  Box,
  Button,
  TextField,
  Typography,
  Avatar,
  Container,
  Paper,
  Divider,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    avatar_url: ''
  });
  const [previewUrl, setPreviewUrl] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const getUserProfile = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          console.error('Error getting user:', error);
          navigate('/');
          return;
        }

        setUser(user);
        setFormData({
          full_name: user.user_metadata?.full_name || '',
          email: user.email || '',
          avatar_url: user.user_metadata?.avatar_url || ''
        });
        setPreviewUrl(user.user_metadata?.avatar_url || '');
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    getUserProfile();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setSaving(true);
      
      // Generate a unique filename
      const fileName = `${user.id}-${Date.now()}-${file.name}`;
      
      // Upload the file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setPreviewUrl(publicUrl);
      setFormData(prev => ({
        ...prev,
        avatar_url: publicUrl
      }));
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) return;
    
    try {
      setSaving(true);
      
      // Update user metadata in Supabase Auth
      const { data, error } = await supabase.auth.updateUser({
        data: { 
          full_name: formData.full_name,
          avatar_url: formData.avatar_url 
        }
      });
      
      if (error) throw error;
      
      // Update the user state with new data
      setUser(data.user);
      
      // Show success message
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Tooltip title="Back to Chat">
            <IconButton onClick={() => navigate('/chat')} sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <Typography variant="h5" component="h1">
            Edit Profile
          </Typography>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        <Box component="form" onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="avatar-upload"
              type="file"
              onChange={handleImageUpload}
              disabled={saving}
            />
            <label htmlFor="avatar-upload">
              <Avatar
                src={previewUrl || formData.avatar_url}
                sx={{ 
                  width: 120, 
                  height: 120, 
                  mb: 2,
                  cursor: 'pointer',
                  '&:hover': { opacity: 0.8 }
                }}
              >
                {formData.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
              </Avatar>
            </label>
            <Typography variant="caption" color="textSecondary">
              Click to change photo
            </Typography>
          </Box>
          
          <TextField
            fullWidth
            margin="normal"
            label="Full Name"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            disabled={saving}
          />
          
          <TextField
            fullWidth
            margin="normal"
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            disabled={true}
            sx={{ mt: 2 }}
          />
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}
