# DEPLOYMENT CHECKLIST

## What I Did (Automated) ✅

- [x] Security fixes applied
- [x] Dependencies updated & vulnerabilities fixed
- [x] Build verified (production build succeeds)
- [x] Unit tests passing (112 tests total)
- [x] Created vercel.json configuration
- [x] Created .env.production template
- [x] Created eas.json configuration
- [x] Created BUILD-STATUS.md
- [x] Created DEPLOYMENT-GUIDE.md
- [x] Created COST-ESTIMATE.md
- [x] Created SECURITY-REPORT.md

---

## What YOU Need To Do (Manual Steps)

### Step 1: Create Accounts (30 minutes)

| Service | URL | What to do |
|---------|-----|------------|
| GitHub | github.com | Push code to your repo |
| Vercel | vercel.com | Sign up (free tier) |
| MongoDB Atlas | mongodb.com/atlas | Create free cluster |
| Stripe | stripe.com | Get API keys |
| Expo | expo.dev | Sign up for EAS |

### Step 2: Configure Environment Variables (15 minutes)

1. Copy `staff-web/.env.production` to `staff-web/.env.local`
2. Fill in your values:
   - `DATABASE_URL` - from MongoDB Atlas
   - `AUTH_SECRET` - generate with `openssl rand -base64 32`
   - `STRIPE_SECRET_KEY` - from Stripe dashboard
   - `ADMIN_SEED_EMAIL` - your admin email
   - `ADMIN_SEED_PASSWORD` - your strong password

### Step 3: Set Up Database (10 minutes)

```bash
cd staff-web

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Create admin user
npm run db:seed
```

### Step 4: Deploy Web App (15 minutes)

#### Option A: Vercel CLI (Easiest)
```bash
cd staff-web

# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

#### Option B: Vercel Dashboard
1. Go to vercel.com/new
2. Import your GitHub repo
3. Select `staff-web` as root directory
4. Add environment variables from `.env.local`
5. Click Deploy

### Step 5: Add Vercel Environment Variables (10 minutes)

1. Go to your Vercel project → Settings → Environment Variables
2. Copy ALL variables from `staff-web/.env.local`
3. Redeploy

### Step 6: Configure Stripe Webhook (10 minutes)

```bash
# Install Stripe CLI
scoop install stripe  # Windows
# or: brew install stripe # Mac

# Login
stripe login

# Listen for webhooks (keep running)
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Get webhook secret and add to Vercel
# STRIPE_WEBHOOK_SECRET=whsec_...
```

### Step 7: Mobile App Deployment (30 minutes)

```bash
cd masjid-mobile

# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure EAS
eas build:configure

# Build for Android (creates APK)
eas build --platform android --profile production

# Build for iOS (requires Mac)
eas build --platform ios --profile production
```

---

## Quick Commands Reference

### Staff Web
```bash
cd staff-web

npm install           # Install dependencies
npm run dev          # Start development
npm run build        # Production build
npm run lint         # Check code
npm run test:run     # Run tests
npm run db:generate  # Generate Prisma
npm run db:push      # Update database
npm run db:seed      # Create admin user
```

### Mobile App
```bash
cd masjid-mobile

npm install          # Install dependencies
npm start           # Start Expo
npm run test:run    # Run tests
eas build:configure  # Configure EAS
eas build            # Build app
eas submit           # Submit to stores
```

---

## Estimated Time

| Task | Time |
|------|------|
| Create accounts | 30 min |
| Environment setup | 15 min |
| Database setup | 10 min |
| Deploy web app | 15 min |
| Stripe webhook | 10 min |
| Mobile app | 30 min |
| **Total** | **~2 hours** |

---

## After Deployment Checklist

- [ ] Test login on deployed site
- [ ] Test donation flow
- [ ] Check mobile app
- [ ] Enable 2FA on admin account
- [ ] Change default admin password
- [ ] Set up MongoDB backup
- [ ] Configure monitoring
