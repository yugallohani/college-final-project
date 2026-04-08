# Quick Deploy to Vercel (5 Minutes)

Follow these steps to deploy NeuroScan to Vercel in under 5 minutes.

## Prerequisites

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login
```

## Step 1: Deploy Backend (2 minutes)

```bash
cd NeuroScan-landing-page/backend

# Deploy
vercel --prod

# When prompted:
# - Project name: neuroscan-backend
# - Directory: ./
# - Override settings: No
```

**Copy the deployment URL** (e.g., `https://neuroscan-backend-xxx.vercel.app`)

### Set Environment Variables

```bash
# Required variables
vercel env add DATABASE_URL production
# Paste: your PostgreSQL connection string

vercel env add GOOGLE_GEMINI_API_KEY production
# Paste: AIzaSyC7-cX0mAUzd--BgLXQtmfmHMDhEDfWtKs

vercel env add ELEVENLABS_API_KEY production
# Paste: 0ae7b1f8886213e38774bfa553dec3222392d290e78f8ad9f42240dfdd0f42e8

vercel env add JWT_SECRET production
# Paste: any_random_secure_string_here

vercel env add ENCRYPTION_KEY production
# Paste: any_32_character_random_string

vercel env add NODE_ENV production
# Paste: production

vercel env add AI_PROVIDER production
# Paste: gemini

vercel env add USE_GEMINI production
# Paste: true

# Redeploy with environment variables
vercel --prod
```

## Step 2: Deploy Frontend (2 minutes)

```bash
cd ..  # Back to NeuroScan-landing-page

# Create production environment file
echo "VITE_API_URL=https://your-backend-url.vercel.app" > .env.production
# Replace with your actual backend URL from Step 1

# Deploy
vercel --prod

# When prompted:
# - Project name: neuroscan-frontend
# - Directory: ./
# - Override settings: No
```

**Copy the deployment URL** (e.g., `https://neuroscan-frontend-xxx.vercel.app`)

## Step 3: Update CORS (1 minute)

```bash
cd backend

# Add frontend URL to CORS
vercel env add CORS_ORIGIN production
# Paste: https://your-frontend-url.vercel.app

# Redeploy backend
vercel --prod
```

## Step 4: Setup Database

### Option A: Vercel Postgres
1. Go to Vercel Dashboard
2. Select your backend project
3. Go to Storage tab
4. Create Postgres database
5. Copy connection string
6. Update `DATABASE_URL` environment variable

### Option B: Neon (Free)
1. Go to [neon.tech](https://neon.tech)
2. Create project
3. Copy connection string
4. Update `DATABASE_URL` environment variable

### Run Migrations
Connect to your database and run:
```sql
-- Copy contents from backend/src/database/schema.sql
-- Execute in your PostgreSQL client
```

## Step 5: Test

```bash
# Test backend
curl https://your-backend-url.vercel.app/api/health

# Test frontend
# Open https://your-frontend-url.vercel.app in browser
```

## Done! 🎉

Your NeuroScan app is now live:
- Frontend: `https://your-frontend-url.vercel.app`
- Backend: `https://your-backend-url.vercel.app`

## Troubleshooting

### CORS Errors
```bash
cd backend
vercel env add CORS_ORIGIN production
# Enter your frontend URL
vercel --prod
```

### Database Connection Errors
- Verify `DATABASE_URL` is set correctly
- Check database is accessible from Vercel
- Run migrations

### API Key Errors
- Verify all API keys are set in Vercel dashboard
- Check keys are valid and have correct permissions

## Using the Automated Script

Instead of manual steps, use the deployment script:

```bash
cd NeuroScan-landing-page
./deploy.sh
```

Follow the prompts to deploy backend, frontend, and configure CORS automatically.
