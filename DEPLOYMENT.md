# 🚀 Production Deployment Guide

## 🔐 Security & Performance Optimized Deployment

This guide provides step-by-step instructions for deploying your secure, high-performance Next.js application.

## 📋 Pre-Deployment Checklist

### **Environment Setup**
- [ ] Copy `.env.example` to `.env.local`
- [ ] Set strong `NEXTAUTH_SECRET` (minimum 32 characters)
- [ ] Configure production API endpoints
- [ ] Set up SSL certificates
- [ ] Configure domain settings

### **Security Verification**
- [ ] Run security audit: `npm run security:audit`
- [ ] Fix any vulnerabilities: `npm run security:fix`
- [ ] Verify environment variables are not exposed
- [ ] Test rate limiting functionality
- [ ] Verify HTTPS redirects work
- [ ] Test authentication flows

### **Performance Optimization**
- [ ] Run bundle analysis: `npm run analyze`
- [ ] Optimize images and assets
- [ ] Enable CDN for static assets
- [ ] Set up Redis for production rate limiting
- [ ] Configure database connection pooling

## 🏗️ Build Process

### **Development Build**
```bash
npm run dev
```

### **Production Build**
```bash
npm run build:prod
```

### **Production Start**
```bash
npm run start:prod
```

## 🌐 Environment Configuration

### **Production Environment Variables**
```bash
# Core Configuration
NODE_ENV=production
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-super-secure-secret-key-here-minimum-32-characters

# API Configuration
API_BASE_URL=https://api.lajolie-eg.com/api

# Security Keys
ENCRYPTION_KEY=your-encryption-key-for-sensitive-data
JWT_SIGNING_KEY=your-jwt-signing-key

# Database (if needed)
DATABASE_URL=postgresql://user:password@host:5432/database

# Redis for Rate Limiting
REDIS_URL=redis://your-redis-host:6379

# Domain Configuration
DOMAIN=yourdomain.com

# Monitoring
SENTRY_DSN=your-sentry-dsn-for-error-tracking
LOG_LEVEL=warn
```

## 🐳 Docker Deployment

### **Dockerfile**
```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build with production config
RUN npm run build:prod

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### **Docker Compose**
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXTAUTH_URL=https://yourdomain.com
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - API_BASE_URL=${API_BASE_URL}
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  redis_data:
```

## 🔧 Server Configuration

### **Nginx Configuration**
```nginx
events {
    worker_connections 1024;
}

http {
    upstream nextjs {
        server app:3000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=auth:10m rate=10r/m;
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
    limit_req_zone $binary_remote_addr zone=general:10m rate=200r/m;

    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name yourdomain.com www.yourdomain.com;

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
        ssl_prefer_server_ciphers off;

        # Security Headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
        add_header X-Frame-Options DENY always;
        add_header X-Content-Type-Options nosniff always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # Rate Limiting
        location /api/auth/ {
            limit_req zone=auth burst=5 nodelay;
            proxy_pass http://nextjs;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://nextjs;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location / {
            limit_req zone=general burst=50 nodelay;
            proxy_pass http://nextjs;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Static assets caching
        location /_next/static/ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            proxy_pass http://nextjs;
        }
    }
}
```

## 📊 Monitoring & Logging

### **Health Check Endpoint**
Create `/pages/api/health.js`:
```javascript
export default function handler(req, res) {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version
  });
}
```

### **Monitoring Setup**
- **Application Monitoring**: Sentry, DataDog, or New Relic
- **Infrastructure Monitoring**: Prometheus + Grafana
- **Log Aggregation**: ELK Stack or Fluentd
- **Uptime Monitoring**: Pingdom, UptimeRobot

## 🚨 Security Monitoring

### **Security Logs to Monitor**
- Failed authentication attempts
- Rate limit violations
- Suspicious user agents
- Unusual traffic patterns
- Token refresh failures

### **Alerting Rules**
- More than 10 failed logins from same IP
- Rate limit exceeded threshold
- Unusual geographic access patterns
- High error rates
- SSL certificate expiration

## 🔄 CI/CD Pipeline

### **GitHub Actions Example**
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  security-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run security:audit
      - run: npm run lint

  build-and-deploy:
    needs: security-audit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build:prod
      - name: Deploy to production
        run: |
          # Your deployment script here
          echo "Deploying to production..."
```

## 🧪 Testing in Production

### **Post-Deployment Tests**
```bash
# Health check
curl -f https://yourdomain.com/api/health

# Authentication flow
curl -X POST https://yourdomain.com/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"mobile":"01234567890","password":"TestPass123"}'

# Rate limiting test
for i in {1..15}; do
  curl -X POST https://yourdomain.com/api/auth/signin
done

# Security headers check
curl -I https://yourdomain.com/
```

## 🔧 Troubleshooting

### **Common Issues**
1. **NEXTAUTH_SECRET not set**: Ensure environment variable is configured
2. **Rate limiting too aggressive**: Adjust limits in security config
3. **CORS errors**: Check allowed origins in security config
4. **SSL certificate issues**: Verify certificate installation
5. **Database connection errors**: Check connection string and firewall

### **Performance Issues**
1. **Slow API responses**: Check database queries and indexes
2. **High memory usage**: Analyze bundle size and optimize
3. **Rate limiting false positives**: Review IP detection logic
4. **Slow page loads**: Enable CDN and optimize images

## 📈 Performance Metrics

### **Key Metrics to Monitor**
- Response time (< 200ms target)
- Error rate (< 0.1% target)
- Throughput (requests per second)
- Memory usage (< 80% target)
- CPU usage (< 70% target)
- Database connection pool usage

### **Security Metrics**
- Failed authentication rate
- Rate limit hit rate
- Suspicious activity alerts
- Token refresh success rate
- SSL certificate health

## 🔄 Maintenance

### **Regular Tasks**
- [ ] Update dependencies monthly
- [ ] Rotate encryption keys quarterly
- [ ] Review security logs weekly
- [ ] Test backup/recovery monthly
- [ ] Update SSL certificates before expiry
- [ ] Review and update rate limits
- [ ] Audit user permissions quarterly

### **Security Updates**
- Monitor security advisories
- Test updates in staging first
- Apply critical security patches within 24 hours
- Document all changes

---

**Last Updated**: January 2024  
**Version**: 1.0  
**Maintained By**: DevOps Team