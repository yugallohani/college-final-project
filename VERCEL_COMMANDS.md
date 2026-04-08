# Vercel CLI Commands Reference

Quick reference for deploying NeuroScan to Vercel.

## Installation & Login

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Check version
vercel --version
```

## Backend Deployment

```bash
cd NeuroScan-landing-page/backend

# Deploy to preview (development)
vercel

# Deploy to production
vercel --prod

# Deploy with auto-confirm
vercel --prod --yes
```

## Frontend Deployment

```bash
cd NeuroScan-landing-page

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Deploy with auto-confirm
vercel --prod --yes
```

## Environment Variables

```bash
# Add environment variable (interactive)
vercel env add VARIABLE_NAME

# Add for specific environment
vercel env add VARIABLE_NAME production
vercel env add VARIABLE_NAME preview
vercel env add VARIABLE_NAME development

# List all environment variables
vercel env ls

# Remove environment variable
vercel env rm VARIABLE_NAME production

# Pull environment variables to local .env
vercel env pull
```

## Project Management

```bash
# List all deployments
vercel ls

# List deployments for specific project
vercel ls neuroscan-backend

# Get deployment info
vercel inspect [deployment-url]

# Remove deployment
vercel rm [deployment-url]

# Link local project to Vercel project
vercel link
```

## Logs & Monitoring

```bash
# View real-time logs
vercel logs

# View logs for specific deployment
vercel logs [deployment-url]

# Follow logs (like tail -f)
vercel logs --follow

# View logs from last 24 hours
vercel logs --since 24h
```

## Domains

```bash
# Add custom domain
vercel domains add yourdomain.com

# List domains
vercel domains ls

# Remove domain
vercel domains rm yourdomain.com

# Verify domain
vercel domains verify yourdomain.com
```

## Rollback

```bash
# List deployments
vercel ls

# Promote a previous deployment to production
vercel promote [deployment-url]

# Alias a deployment
vercel alias [deployment-url] [custom-url]
```

## Secrets (Secure Environment Variables)

```bash
# Add secret
vercel secrets add my-secret-name "secret-value"

# List secrets
vercel secrets ls

# Remove secret
vercel secrets rm my-secret-name

# Use secret in environment variable
# In vercel.json:
# "env": {
#   "API_KEY": "@my-secret-name"
# }
```

## Project Settings

```bash
# Open project in browser
vercel

# Get project info
vercel project ls

# Remove project
vercel project rm neuroscan-backend
```

## Complete Deployment Flow

### Backend
```bash
cd NeuroScan-landing-page/backend

# First time setup
vercel

# Set environment variables
vercel env add DATABASE_URL production
vercel env add GOOGLE_GEMINI_API_KEY production
vercel env add ELEVENLABS_API_KEY production
vercel env add JWT_SECRET production
vercel env add ENCRYPTION_KEY production
vercel env add NODE_ENV production
vercel env add AI_PROVIDER production
vercel env add USE_GEMINI production

# Deploy to production
vercel --prod

# View logs
vercel logs --follow
```

### Frontend
```bash
cd NeuroScan-landing-page

# Create production env file
echo "VITE_API_URL=https://your-backend.vercel.app" > .env.production

# First time setup
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs --follow
```

### Update CORS
```bash
cd backend
vercel env add CORS_ORIGIN production
# Enter: https://your-frontend.vercel.app
vercel --prod
```

## Troubleshooting Commands

```bash
# Check deployment status
vercel ls

# View detailed logs
vercel logs [deployment-url] --follow

# Inspect deployment
vercel inspect [deployment-url]

# Test locally with Vercel environment
vercel dev

# Pull environment variables
vercel env pull

# Redeploy (force rebuild)
vercel --prod --force
```

## Useful Flags

```bash
--prod              # Deploy to production
--yes               # Skip confirmation prompts
--force             # Force rebuild
--debug             # Show debug information
--token [TOKEN]     # Use specific auth token
--scope [TEAM]      # Deploy to specific team
--local-config      # Use local vercel.json
```

## Quick Commands

```bash
# Deploy everything
cd backend && vercel --prod && cd .. && vercel --prod

# View all logs
vercel logs --follow

# Check health
curl https://your-backend.vercel.app/api/health

# Redeploy both
cd backend && vercel --prod --force && cd .. && vercel --prod --force
```

## Environment Variable Template

```bash
# Backend (.env)
DATABASE_URL=postgresql://user:pass@host:5432/db
GOOGLE_GEMINI_API_KEY=AIzaSyC7-cX0mAUzd--BgLXQtmfmHMDhEDfWtKs
ELEVENLABS_API_KEY=0ae7b1f8886213e38774bfa553dec3222392d290e78f8ad9f42240dfdd0f42e8
JWT_SECRET=your_random_secret_here
ENCRYPTION_KEY=your_32_character_key_here_12345
NODE_ENV=production
AI_PROVIDER=gemini
USE_GEMINI=true
CORS_ORIGIN=https://your-frontend.vercel.app

# Frontend (.env.production)
VITE_API_URL=https://your-backend.vercel.app
```

## Common Issues & Solutions

### Issue: Build fails
```bash
# Check logs
vercel logs [deployment-url]

# Try local build first
npm run build

# Force rebuild
vercel --prod --force
```

### Issue: Environment variables not working
```bash
# List variables
vercel env ls

# Pull to local
vercel env pull

# Redeploy
vercel --prod
```

### Issue: CORS errors
```bash
cd backend
vercel env add CORS_ORIGIN production
# Enter frontend URL
vercel --prod
```

### Issue: Database connection fails
```bash
# Verify DATABASE_URL
vercel env ls

# Test connection locally
export DATABASE_URL="your_connection_string"
npm run migrate
```

## Automated Deployment Script

Use the provided script for easier deployment:

```bash
cd NeuroScan-landing-page
./deploy.sh
```

The script will:
1. Deploy backend
2. Deploy frontend
3. Configure CORS
4. Provide deployment URLs

## Next Steps After Deployment

1. Test health endpoint:
   ```bash
   curl https://your-backend.vercel.app/api/health
   ```

2. Open frontend in browser:
   ```bash
   open https://your-frontend.vercel.app
   ```

3. Create user account and test assessment

4. Monitor logs:
   ```bash
   vercel logs --follow
   ```

5. Set up custom domain (optional):
   ```bash
   vercel domains add yourdomain.com
   ```

## Resources

- Vercel Docs: https://vercel.com/docs
- Vercel CLI Docs: https://vercel.com/docs/cli
- Vercel Support: https://vercel.com/support
