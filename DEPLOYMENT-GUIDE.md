# Family Chat - Coolify Deployment Guide

This guide will walk you through deploying the Family Chat application on your self-hosted Coolify instance.

## Prerequisites

1. A running Coolify instance (v3 or later)
2. Docker and Docker Compose installed on your Coolify server
3. A Supabase project with the database schema set up (as described in README.md)
4. A domain name pointed to your Coolify server (recommended)

## Deployment Steps

### 1. Prepare Your Repository

1. Push your code to a Git repository (GitHub, GitLab, or any Git provider supported by Coolify)
2. Ensure all required files are committed:
   - `Dockerfile`
   - `docker-compose.yml`
   - `nginx.conf`
   - Source code
   - `.env.example` (for reference)

### 2. Set Up Environment Variables

In your Coolify dashboard:

1. Create a new application
2. Go to the "Environment Variables" section
3. Add the following environment variables:
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anon/public key

### 3. Configure the Application in Coolify

1. **Application Name**: `family-chat` (or your preferred name)
2. **Repository**: Select your Git repository
3. **Branch**: `main` (or your preferred branch)
4. **Build Method**: Select "Dockerfile"
5. **Dockerfile Location**: `./Dockerfile`
6. **Port**: `80` (this is the internal port Nginx uses)
7. **Build Command**: Leave empty (Coolify will handle this automatically)
8. **Start Command**: Leave empty (defined in Dockerfile)

### 4. Configure Networking

1. **Exposed Port**: Map port 80 to a host port (e.g., 3000)
2. **Network**: Use the default bridge network or create a new one
3. **Domain**: Add your custom domain (recommended) or use the Coolify subdomain

### 5. Set Up SSL/TLS

1. Go to the "SSL" section in your Coolify application settings
2. Enable "Auto SSL" to get automatic Let's Encrypt certificates
3. Add your domain and verify ownership

### 6. Deploy the Application

1. Click on "Deploy" in the Coolify dashboard
2. Monitor the build and deployment logs for any issues
3. Once deployed, your application should be accessible at your configured domain

## Post-Deployment

### 1. Verify the Application

1. Open your application in a web browser
2. Test user registration and login
3. Send test messages to verify real-time functionality

### 2. Set Up Backups (Recommended)

1. In Coolify, go to the "Backups" section
2. Configure automatic backups for your application
3. Set up a backup schedule (e.g., daily)

### 3. Monitoring and Logs

1. Use Coolify's built-in log viewer to monitor application logs
2. Set up alerts for any critical errors

## Updating the Application

1. Push your changes to the Git repository
2. Coolify will automatically detect changes and trigger a new build
3. Monitor the deployment in the Coolify dashboard

## Troubleshooting

### Application Not Starting
- Check the logs in the Coolify dashboard
- Verify all environment variables are set correctly
- Ensure the Supabase URL and API key are valid

### Database Connection Issues
- Verify your Supabase project is running
- Check if the database schema is properly set up
- Ensure the IP of your Coolify server is whitelisted in Supabase (if using IP restrictions)

### Real-time Not Working
- Ensure WebSockets are properly configured in your reverse proxy (if using one)
- Check if the Supabase Realtime service is enabled for your tables

## Security Considerations

1. **Environment Variables**: Never commit sensitive information to your repository
2. **Dependencies**: Keep all dependencies updated
3. **HTTPS**: Always use HTTPS in production
4. **Rate Limiting**: Consider implementing rate limiting for the authentication endpoints

## Support

If you encounter any issues, please refer to the [Coolify documentation](https://coolify.io/docs) or open an issue in the project repository.
