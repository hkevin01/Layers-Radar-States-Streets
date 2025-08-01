# Installation and Deployment Guide

## Table of Contents

- [System Requirements](#system-requirements)
- [Development Setup](#development-setup)
- [Production Deployment](#production-deployment)
- [Environment Configuration](#environment-configuration)
- [Troubleshooting](#troubleshooting)
- [Maintenance](#maintenance)

---

## System Requirements

### Minimum Requirements

#### Development Environment
- **Node.js**: 16.0.0 or higher
- **npm**: 8.0.0 or higher
- **Git**: 2.25.0 or higher
- **Modern Web Browser**: Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+

#### Production Environment
- **Web Server**: Apache 2.4+, Nginx 1.18+, or Node.js HTTP server
- **SSL Certificate**: Required for PWA functionality and HTTPS
- **Storage**: Minimum 500MB for caching and static assets
- **Memory**: 1GB RAM minimum, 2GB recommended

#### Client Requirements
- **Browser**: ES6 module support required
- **JavaScript**: Must be enabled
- **Storage**: ~50MB for offline caching
- **Network**: 1 Mbps minimum, 5 Mbps recommended for real-time features

### Recommended Specifications

#### Development
```bash
# Recommended development environment
Node.js: 18.x LTS
npm: 9.x
RAM: 8GB
Storage: 2GB free space
OS: Windows 10+, macOS 10.15+, Ubuntu 20.04+
```

#### Production
```bash
# Recommended production environment
CPU: 2+ cores
RAM: 4GB
Storage: 10GB SSD
Bandwidth: 100 Mbps
CDN: Recommended for global distribution
```

---

## Development Setup

### Quick Start

#### 1. Clone Repository
```bash
# Clone the repository
git clone https://github.com/hkevin01/Layers-Radar-States-Streets.git
cd Layers-Radar-States-Streets

# Verify Node.js version
node --version  # Should be 16+ 
npm --version   # Should be 8+
```

#### 2. Install Dependencies
```bash
# Install all dependencies
npm install

# Verify installation
npm list --depth=0
```

#### 3. Start Development Server
```bash
# Start development server on port 8080
npm start

# Alternative: Start on custom port
npx http-server public -p 3000 -o
```

#### 4. Access Application
```bash
# Open in browser
http://localhost:8080
```

### Development Commands

#### Available npm Scripts
```bash
# Development
npm start          # Start development server
npm run dev        # Alternative development server

# Code Quality
npm run lint       # Run ESLint
npm run lint:fix   # Auto-fix linting issues
npm run format     # Format code with Prettier

# Testing
npm test           # Run test suite
npm run test:watch # Watch mode for tests

# Build & Deployment
npm run build      # Run full build pipeline
npm run serve      # Start production-like server
```

#### Environment Variables
Create a `.env` file in the project root:

```bash
# .env file
NODE_ENV=development
PORT=8080
API_BASE_URL=https://api.weather.gov
WEBSOCKET_URL=wss://api.weather.gov/stream
DEBUG=true
```

### IDE Setup

#### VS Code (Recommended)
Install recommended extensions:

```json
// .vscode/extensions.json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-json",
    "bradlc.vscode-tailwindcss"
  ]
}
```

#### VS Code Settings
```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "eslint.autoFixOnSave": true,
  "emmet.includeLanguages": {
    "javascript": "javascriptreact"
  }
}
```

### Git Hooks Setup

#### Pre-commit Hooks
```bash
# Install husky for Git hooks
npm install --save-dev husky

# Setup pre-commit hook
npx husky add .husky/pre-commit "npm run lint && npm test"
```

---

## Production Deployment

### Static File Deployment

#### Option 1: Static Web Hosting (Recommended)
```bash
# Build for production
npm run build

# Deploy public/ directory to:
# - Netlify
# - Vercel  
# - GitHub Pages
# - AWS S3 + CloudFront
# - Azure Static Web Apps
```

#### Netlify Deployment
```bash
# Build command
npm run build

# Publish directory
public

# Environment variables (optional)
NODE_ENV=production
API_BASE_URL=https://api.weather.gov
```

##### netlify.toml Configuration
```toml
[build]
  command = "npm run build"
  publish = "public"

[build.environment]
  NODE_ENV = "production"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Content-Security-Policy = "default-src 'self'; img-src 'self' data: https:; connect-src 'self' wss: https:; style-src 'self' 'unsafe-inline';"

[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "no-cache"

[[headers]]
  for = "/manifest.json"
  [headers.values]
    Cache-Control = "public, max-age=86400"
```

#### Option 2: Docker Deployment
```dockerfile
# Dockerfile
FROM nginx:alpine

# Copy static files
COPY public/ /usr/share/nginx/html/

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

```bash
# Build and run Docker container
docker build -t weather-radar-app .
docker run -p 80:80 weather-radar-app
```

### Server Configuration

#### Nginx Configuration
```nginx
# nginx.conf
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL Configuration
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # Security Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Content-Security-Policy "default-src 'self'; img-src 'self' data: https:; connect-src 'self' wss: https:; style-src 'self' 'unsafe-inline';" always;
    
    # Root directory
    root /var/www/weather-radar;
    index index.html;
    
    # Main application
    location / {
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Service Worker - No cache
    location /sw.js {
        add_header Cache-Control "no-cache";
        expires off;
    }
    
    # Manifest - Short cache
    location /manifest.json {
        expires 1d;
        add_header Cache-Control "public";
    }
    
    # API Proxy (if needed)
    location /api/ {
        proxy_pass https://api.weather.gov/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # Gzip Compression
    gzip on;
    gzip_types text/css application/javascript application/json;
    gzip_min_length 1000;
}
```

#### Apache Configuration
```apache
# .htaccess
<IfModule mod_rewrite.c>
    RewriteEngine On
    
    # HTTPS Redirect
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
    
    # SPA Routing
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</IfModule>

# Security Headers
<IfModule mod_headers.c>
    Header always set X-Frame-Options "DENY"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set X-Content-Type-Options "nosniff"
    Header always set Content-Security-Policy "default-src 'self'; img-src 'self' data: https:; connect-src 'self' wss: https:; style-src 'self' 'unsafe-inline';"
</IfModule>

# Caching
<IfModule mod_expires.c>
    ExpiresActive on
    
    # Static assets
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    
    # Service Worker
    <Files "sw.js">
        ExpiresDefault "access plus 0 seconds"
        Header set Cache-Control "no-cache, no-store, must-revalidate"
    </Files>
    
    # Manifest
    <Files "manifest.json">
        ExpiresDefault "access plus 1 day"
    </Files>
</IfModule>

# Compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/json
</IfModule>
```

### CDN Configuration

#### CloudFlare Setup
```javascript
// CloudFlare Worker for enhanced caching
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const cache = caches.default
  const cacheKey = new Request(request.url, request)
  
  // Check cache first
  let response = await cache.match(cacheKey)
  
  if (!response) {
    // Fetch from origin
    response = await fetch(request)
    
    // Cache based on file type
    if (request.url.includes('.js') || request.url.includes('.css')) {
      const cacheResponse = response.clone()
      cacheResponse.headers.set('Cache-Control', 'public, max-age=31536000')
      event.waitUntil(cache.put(cacheKey, cacheResponse))
    }
  }
  
  return response
}
```

---

## Environment Configuration

### Production Environment Variables

#### Required Variables
```bash
# Production .env
NODE_ENV=production
API_BASE_URL=https://api.weather.gov
WEBSOCKET_URL=wss://api.weather.gov/stream
SENTRY_DSN=https://your-sentry-dsn
ANALYTICS_ID=your-analytics-id
```

#### Optional Variables
```bash
# Optional configuration
DEBUG=false
LOG_LEVEL=error
CDN_URL=https://cdn.your-domain.com
FEATURE_FLAGS=realtime,offline,notifications
```

### Configuration Files

#### Production Configuration
```javascript
// src/config/production.js
export const PRODUCTION_CONFIG = {
  api: {
    baseURL: process.env.API_BASE_URL || 'https://api.weather.gov',
    timeout: 10000,
    retries: 3
  },
  features: {
    realtime: true,
    offline: true,
    notifications: true,
    analytics: true
  },
  performance: {
    enableWebGL: true,
    preloadTiles: true,
    cacheSize: 100 * 1024 * 1024 // 100MB
  }
};
```

#### Environment Detection
```javascript
// src/utils/environment.js
export function getEnvironment() {
  if (typeof window !== 'undefined') {
    // Browser environment
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'development';
    } else if (hostname.includes('staging')) {
      return 'staging';
    } else {
      return 'production';
    }
  }
  
  // Node.js environment
  return process.env.NODE_ENV || 'development';
}
```

---

## Security Configuration

### HTTPS Setup

#### SSL Certificate Installation
```bash
# Using Let's Encrypt with Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Content Security Policy

#### CSP Header Configuration
```javascript
// Recommended CSP for production
const csp = `
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' wss: https:;
  font-src 'self';
  object-src 'none';
  media-src 'self';
  frame-src 'none';
  worker-src 'self';
  manifest-src 'self';
`.replace(/\s+/g, ' ').trim();
```

### CORS Configuration
```javascript
// CORS headers for API integration
{
  "Access-Control-Allow-Origin": "https://your-domain.com",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400"
}
```

---

## Monitoring and Analytics

### Performance Monitoring

#### Setup Performance Tracking
```javascript
// Performance monitoring setup
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  const body = JSON.stringify(metric);
  
  // Use beacon API for reliability
  if ('sendBeacon' in navigator) {
    navigator.sendBeacon('/analytics', body);
  } else {
    fetch('/analytics', { method: 'POST', body });
  }
}

// Track Core Web Vitals
getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

#### Google Analytics Setup
```html
<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Error Tracking

#### Sentry Integration
```javascript
// Sentry setup for error tracking
import * as Sentry from "@sentry/browser";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  beforeSend(event) {
    // Filter out irrelevant errors
    if (event.exception) {
      const error = event.exception.values[0];
      if (error.value && error.value.includes('ResizeObserver')) {
        return null; // Don't send ResizeObserver errors
      }
    }
    return event;
  }
});
```

---

## Health Checks and Monitoring

### Application Health Check
```javascript
// Health check endpoint
export function healthCheck() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    checks: {
      api: 'unknown',
      storage: 'unknown',
      serviceWorker: 'unknown'
    }
  };
  
  // Check API connectivity
  fetch('/api/health')
    .then(() => health.checks.api = 'healthy')
    .catch(() => health.checks.api = 'unhealthy');
  
  // Check local storage
  try {
    localStorage.setItem('health-check', 'test');
    localStorage.removeItem('health-check');
    health.checks.storage = 'healthy';
  } catch (e) {
    health.checks.storage = 'unhealthy';
  }
  
  // Check service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then(() => health.checks.serviceWorker = 'healthy')
      .catch(() => health.checks.serviceWorker = 'unhealthy');
  }
  
  return health;
}
```

### Uptime Monitoring
```bash
# Uptime monitoring with curl
curl -f https://your-domain.com/health || echo "Site is down"

# Monitor key functionality
curl -f https://your-domain.com/api/layers || echo "API is down"
```

---

## Backup and Recovery

### Data Backup
```bash
# Backup user preferences and cached data
cp -r ~/.local/share/weather-radar-app/ ./backup/

# Backup configuration files
tar -czf config-backup.tar.gz nginx.conf .env docker-compose.yml
```

### Disaster Recovery Plan
1. **DNS Failover**: Configure DNS failover to backup hosting
2. **Database Backup**: Regular backups of user data (if applicable)
3. **CDN Failover**: Multiple CDN providers for static assets
4. **Monitoring Alerts**: Real-time alerts for downtime or errors

---

*This installation guide provides comprehensive instructions for setting up and deploying the Layers Radar States Streets application in various environments. For additional support, refer to the troubleshooting section or contact the development team.*
