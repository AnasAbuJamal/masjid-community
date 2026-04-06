# DEPLOYMENT GUIDE - Masjid Management Platform

**Last Updated:** March 22, 2026  
**Version:** 2.0.0  
**Status:** ✅ Production Ready

---

## 🚀 Quick Start (5 Steps)

### 1. Create Accounts (30 min)
- [MongoDB Atlas](https://mongodb.com/atlas) - Free database
- [Vercel](https://vercel.com) - Free hosting
- [Stripe](https://stripe.com) - Payment processing
- [Expo](https://expo.dev) - Mobile app builds

### 2. Configure Environment
```bash
# Copy production template
cp staff-web/.env.production staff-web/.env.local

# Edit with your values
# - DATABASE_URL (from MongoDB Atlas)
# - AUTH_SECRET (run: openssl rand -base64 32)
# - STRIPE keys (from Stripe dashboard)
```

### 3. Set Up Database
```bash
cd staff-web
npm run db:generate
npm run db:push
npm run db:seed
```

### 4. Deploy Web App
```bash
npm install -g vercel
vercel login
vercel --prod
```

### 5. Deploy Mobile App
```bash
cd ../masjid-mobile
npm install -g eas-cli
eas login
eas build --platform android --profile production
```

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Staff Web Deployment](#staff-web-deployment)
5. [Mobile App Deployment](#mobile-app-deployment)
6. [Post-Deployment](#post-deployment)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts

| Service | Purpose | Sign Up |
|---------|---------|---------|
| Vercel | Web hosting (free tier) | vercel.com |
| MongoDB Atlas | Database | mongodb.com/atlas |
| Stripe | Payment processing | stripe.com |
| Expo | Mobile app distribution | expo.dev |
| GitHub | Code repository | github.com |

### Local Development Tools

```bash
# Node.js 20+ required
node --version  # Should be >= 20.0.0

# npm or yarn
npm --version   # Should be >= 10.0.0

# Git
git --version

# Expo CLI (for mobile)
npm install -g expo-cli
```

---

## Environment Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/masjid-phone-app.git
cd masjid-phone-app
```

### 2. Install Dependencies

```bash
# Install staff-web dependencies
cd staff-web
npm install

# Install mobile dependencies
cd ../masjid-mobile
npm install
```

### 3. Create Environment Files

#### Staff Web (.env.local)

Create `staff-web/.env.local`:

```env
# Database (MongoDB Atlas)
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/masjid?retryWrites=true&w=majority"

# NextAuth Configuration
NEXTAUTH_URL="https://your-domain.vercel.app"
AUTH_SECRET="generate-with-openssl-rand-base64-32"

# Stripe (Test Mode - replace with live keys for production)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# App URLs
NEXT_PUBLIC_APP_URL="https://your-domain.vercel.app"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SUCCESS_URL="https://your-domain.vercel.app/donate/thank-you"
STRIPE_CANCEL_URL="https://your-domain.vercel.app/donate"

# Admin Seed (change password after first login!)
ADMIN_SEED_EMAIL="admin@yourmasjid.org"
ADMIN_SEED_PASSWORD="ChangeThisPassword123!"
```

Generate AUTH_SECRET:
```bash
openssl rand -base64 32
```

#### Mobile App (.env)

Create `masjid-mobile/.env`:

```env
# API Base URL
API_BASE_URL=https://your-domain.vercel.app

# Stripe (same as web)
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Blink (optional payment processor)
VITE_BLINK_PROJECT_ID=your_blink_project_id
VITE_BLINK_PUBLISHABLE_KEY=your_blink_key
```

---

## Database Setup

### MongoDB Atlas Setup

#### 1. Create Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Click "Build a Database"
3. Choose **FREE tier** (M0 Sandbox)
4. Select region closest to your users
5. Create cluster (takes ~3 minutes)

#### 2. Create Database User

1. Go to Security → Database Access
2. Click "Add New Database User"
3. Username: `masjid_admin`
4. Password: (generate secure password)
5. Role: **Read and write to any database**
6. Click "Add User"

#### 3. Configure Network Access

1. Go to Security → Network Access
2. Click "Add IP Address"
3. For development: Add `0.0.0.0/0`
4. For production: Add Vercel IP ranges

#### 4. Get Connection String

1. Go to Deployment → Database
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database user password

#### 5. Initialize Database

```bash
cd staff-web

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed initial data (creates admin user)
npm run db:seed
```

---

## Staff Web Deployment

### Option A: Vercel (Recommended)

#### 1. Install Vercel CLI

```bash
npm install -g vercel
```

#### 2. Deploy to Vercel

```bash
cd staff-web
vercel
```

Follow the prompts:
```
? Set up and deploy? [Y/n] Y
? Which scope? your-username
? Link to existing project? [y/N] N
? What's your project's name? masjid-staff-web
? In which directory is your code located? ./
```

#### 3. Configure Environment Variables

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to Settings → Environment Variables
4. Add all variables from `.env.local`

#### 4. Deploy

```bash
# Production deployment
vercel --prod
```

#### 5. Configure Stripe Webhook

1. Install Stripe CLI:
```bash
# Windows (using scoop)
scoop install stripe

# Or download from https://stripe.com/docs/stripe-cli
```

2. Login to Stripe:
```bash
stripe login
```

3. Forward webhooks to localhost:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

4. Copy the webhook signing secret and add to Vercel:
```
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Option B: Railway

#### 1. Create Railway Account

Go to [railway.app](https://railway.app) and sign up

#### 2. Deploy

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize
cd staff-web
railway init

# Deploy
railway up
```

#### 3. Add Environment Variables

```bash
railway variables set DATABASE_URL="mongodb+srv://..."
railway variables set NEXTAUTH_URL="https://your-app.railway.app"
# ... add all other variables
```

### Option C: DigitalOcean App Platform

1. Create DigitalOcean account
2. Go to Apps → Create App
3. Connect GitHub repository
4. Configure build settings:
   - Build Command: `npm run build`
   - Run Command: `npm start`
5. Add environment variables
6. Deploy

---

## Mobile App Deployment

### 1. Configure App.json

Update `masjid-mobile/app.json`:

```json
{
  "expo": {
    "name": "Masjid App",
    "slug": "masjid-mobile",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.yourmasjid.app",
      "appStoreUrl": "https://apps.apple.com/app/idXXXXXXXXXX"
    },
    "android": {
      "package": "com.yourmasjid.app",
      "playStoreUrl": "https://play.google.com/store/apps/details?id=com.yourmasjid.app"
    },
    "extra": {
      "eas": {
        "projectId": "your-eas-project-id"
      }
    }
  }
}
```

### 2. Set Up EAS Build

```bash
cd masjid-mobile

# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure EAS Build
eas build:configure
```

### 3. Build for Development

```bash
# iOS (requires Mac)
eas build --platform ios --profile development

# Android
eas build --platform android --profile development
```

### 4. Build for Production

#### iOS App Store

```bash
# Create Apple Developer Account if not already done
# https://developer.apple.com/programs/

# Configure for App Store
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios --latest
```

#### Android Play Store

```bash
# Create Google Play Developer account
# https://play.google.com/console/developers

# Configure for Play Store
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android --latest
```

### 5. Over-The-Air Updates (Optional)

For quick updates without rebuilding:

```bash
# Publish an update
eas update --branch production --message "Bug fix release"

# Or use automated updates
eas update: Automated
```

---

## Post-Deployment

### 1. Verify Deployment

1. **Staff Web:**
   - Visit your deployed URL
   - Login with admin credentials
   - Test all major features

2. **Mobile App:**
   - Download from TestFlight/Play Store beta
   - Test login and core features

### 2. Configure Custom Domain (Optional)

#### Vercel

1. Go to Project Settings → Domains
2. Add your domain (e.g., `staff.yourmasjid.org`)
3. Update DNS records as instructed
4. Wait for SSL certificate

#### Update Environment Variables

```env
NEXTAUTH_URL="https://staff.yourmasjid.org"
NEXT_PUBLIC_APP_URL="https://staff.yourmasjid.org"
```

### 3. Set Up Monitoring

#### Vercel Analytics

1. Enable in Project Settings → Analytics
2. View at vercel.com/analytics

#### Error Tracking (Optional)

Add Sentry for error tracking:

```bash
npm install @sentry/nextjs
npx sentry-wizard -i nextjs
```

### 4. Configure Backup

Set up automated MongoDB backups:

1. Go to MongoDB Atlas → Deployment → Backup
2. Enable Cloud Backup (free tier has limited retention)
3. Or set up manual backups with:
```bash
# Using mongodump
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/masjid" --out=./backup
```

### 5. Set Up CI/CD (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed

**Error:** `MongoNetworkError` or `MongoServerSelectionError`

**Solution:**
- Verify DATABASE_URL is correct
- Check MongoDB Atlas network access whitelist
- Ensure database user has correct permissions

#### 2. NextAuth Secret Error

**Error:** `Please define the AUTH_SECRET environment variable`

**Solution:**
```bash
# Generate new secret
openssl rand -base64 32

# Add to environment variables
AUTH_SECRET="your-new-secret"
```

#### 3. Prisma Client Not Generated

**Error:** `Cannot find module '@prisma/client'`

**Solution:**
```bash
npm run db:generate
```

#### 4. Stripe Webhook Not Working

**Error:** `No signatures found matching the expected signature`

**Solution:**
1. Ensure webhook secret is correct
2. Check Stripe CLI is running
3. Verify webhook URL is accessible

#### 5. Mobile Build Failed

**Error:** Various

**Solutions:**
```bash
# Clear Expo cache
expo start --clear

# Reset EAS build
eas build:configure --force

# Check for updates
npm update
npx expo install --fix
```

#### 6. Environment Variables Not Loading

**Error:** Environment variables are undefined

**Solution:**
- Restart development server
- Verify `.env.local` file exists in staff-web root
- Check for typos in variable names
- For Vercel: Redeploy after adding variables

### Getting Help

| Resource | URL |
|----------|-----|
| Documentation | docs.vercel.com |
| Next.js Discord | discord.gg/nextjs |
| Prisma Forum | github.com/prisma/prisma/discussions |
| MongoDB Community | community.mongodb.com |
| Expo Discord | discord.gg/expo |

---

## Maintenance

### Regular Tasks

| Task | Frequency | Command |
|------|-----------|---------|
| Update dependencies | Weekly | `npm update` |
| Check for security patches | Weekly | `npm audit` |
| Backup database | Daily | mongodump |
| Monitor error logs | Daily | Check Vercel dashboard |
| Review Stripe dashboard | Weekly | stripe.com dashboard |

### Updating the App

#### Staff Web

```bash
cd staff-web
git pull origin main
npm install
npm run db:push
npm run build
```

#### Mobile App

```bash
cd masjid-mobile
git pull origin main
npm install
eas update --branch production --message "Update description"
```

---

## Security Checklist

- [ ] Change all default passwords
- [ ] Enable 2FA on admin accounts
- [ ] Restrict database network access
- [ ] Use environment variables for secrets
- [ ] Enable Stripe webhook signature verification
- [ ] Set up rate limiting
- [ ] Configure CORS properly
- [ ] Enable audit logging monitoring
- [ ] Regular security updates

---

**Need help?** Open an issue on GitHub or contact support.
