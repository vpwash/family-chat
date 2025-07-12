# Stage 1: Build the application
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --prefer-offline --no-audit --progress=false

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production image with Nginx
FROM nginx:stable-alpine

# Install runtime dependencies
RUN apk add --no-cache tzdata \
    && rm -rf /var/cache/apk/*

# Set timezone (optional)
ENV TZ=UTC

# Create non-root user and group
RUN addgroup -g 1001 nginx-group \
    && adduser -u 1001 -G nginx-group -D -H nginx-user \
    # Create required directories with proper permissions
    && mkdir -p /var/cache/nginx /var/run /var/log/nginx /var/lib/nginx \
    && chown -R nginx-user:nginx-group /var/cache/nginx \
    && chown -R nginx-user:nginx-group /var/run \
    && chown -R nginx-user:nginx-group /var/log/nginx \
    && chown -R nginx-user:nginx-group /var/lib/nginx \
    && chmod -R 755 /var/cache/nginx /var/run /var/log/nginx /var/lib/nginx

# Copy nginx config
COPY --chown=nginx-user:nginx-group nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder --chown=nginx-user:nginx-group /app/dist /usr/share/nginx/html

# Set proper permissions for Nginx files
RUN chmod -R 755 /usr/share/nginx/html \
    && find /usr/share/nginx/html -type f -exec chmod 644 {} \;

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*.md \
    /usr/share/nginx/html/.* 2>/dev/null || true

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost/health || exit 1

# Run as non-root user
USER nginx-user

# Start Nginx with debug logging
CMD ["nginx", "-g", "daemon off; error_log /dev/stderr debug;"]
