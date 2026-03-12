# NeuroScan AI - Troubleshooting Guide

## Common Issues and Solutions

### 1. Backend Won't Start

#### Error: "MongoDB connection error"
**Problem**: MongoDB is not running or connection string is incorrect

**Solutions**:
```bash
# Check if MongoDB is running (macOS)
brew services list

# Start MongoDB
brew services start mongodb-community

# Or check your connection string in backend/.env
MONGODB_URI=mongodb://localhost:27017/neuroscan
```

#### Error: "OPENAI_API_KEY is not defined"
**Problem**: OpenAI API key is missing or incorrect

**Solutions**:
1. Get API key from https://platform.openai.com/api-keys
2. Add to `backend/.env`:
```env
OPENAI_API_KEY=sk-your-actual-api-key-here
```
3. Restart backend server

#### Error: "Port 3001 is already in use"
**Problem**: Another process is using port 3001

**Solutions**:
```bash
# Find process using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>

# Or change port in backend/.env
PORT=3002
```

### 2. Frontend Won't Start

#### Error: "Port 5173 is already in use"
**Problem**: Another Vite dev server is running

**Solutions**:
```bash
# Kill existing Vite process
pkill -f vite

# Or change port in vite.config.ts
server: {
  port: 5174
}
```

#### Error: "Module not found"
**Problem**: Dependencies not installed

**Solutions**:
```bash
cd NeuroScan-landing-page
rm -rf node_modules package-lock.json
npm install
```

### 3. API Connection Issues

#### Error: "Failed to fetch" or "Network Error"
**Problem**: Backend is not running or CORS issue

**Solutions**:
1. Ensure backend is running on port 3001
2. Check backend logs for errors
3. Verify CORS_ORIGIN in backend/.env:
```env
CORS_ORIGIN=http://localhost:5173
```
4. Check API_BASE in frontend pages matches backend URL

#### Error: "Session not found"
**Problem**: Session expired or database cleared

**Solutions**:
1. Start a new session from landing page
2. Check MongoDB is running
3. Check backend logs for database errors

### 4. Chat Interface Issues

#### AI Not Responding
**Problem**: OpenAI API error or rate limit

**Solutions**:
1. Check OpenAI API key is valid
2. Check API credits: https://platform.openai.com/usage
3. Check backend console for error messages
4. Verify internet connection

#### Messages Not Appearing
**Problem**: State management or API error

**Solutions**:
1. Check browser console for errors
2. Refresh the page
3. Start a new session
4. Check backend logs

### 5. Test Administration Issues

#### Questions Not Progressing
**Problem**: Response not being recorded

**Solutions**:
1. Check backend logs for errors
2. Verify response format (score 0-3)
3. Check MongoDB connection
4. Restart session if needed

#### Scores Not Calculating
**Problem**: Incomplete test responses

**Solutions**:
1. Ensure all 9 PHQ-9 questions answered
2. Ensure all 7 GAD-7 questions answered
3. Check backend `/test/:sessionId/scores` endpoint
4. Verify responses in MongoDB

### 6. Report Generation Issues

#### Report Not Loading
**Problem**: Session incomplete or API error

**Solutions**:
1. Ensure both PHQ-9 and GAD-7 are complete
2. Check session phase is 'complete'
3. Check backend logs
4. Try accessing report directly: `/report/:sessionId`

#### Scores Showing as 0
**Problem**: Test responses not saved

**Solutions**:
1. Check MongoDB for session data
2. Verify test responses were recorded
3. Check backend test service logs

### 7. Database Issues

#### MongoDB Connection Timeout
**Problem**: MongoDB not accessible

**Solutions**:
```bash
# Check MongoDB status
brew services list

# Restart MongoDB
brew services restart mongodb-community

# Check MongoDB logs
tail -f /usr/local/var/log/mongodb/mongo.log
```

#### Data Not Persisting
**Problem**: MongoDB not saving data

**Solutions**:
1. Check MongoDB disk space
2. Verify write permissions
3. Check MongoDB logs for errors
4. Test connection:
```bash
mongosh
use neuroscan
db.sessions.find()
```

### 8. OpenAI API Issues

#### Error: "Rate limit exceeded"
**Problem**: Too many API requests

**Solutions**:
1. Wait a few minutes
2. Upgrade OpenAI plan
3. Implement request caching (TODO)

#### Error: "Insufficient credits"
**Problem**: OpenAI account has no credits

**Solutions**:
1. Add credits to OpenAI account
2. Check usage: https://platform.openai.com/usage

#### Error: "Invalid API key"
**Problem**: API key is wrong or expired

**Solutions**:
1. Generate new API key
2. Update backend/.env
3. Restart backend

### 9. Development Issues

#### TypeScript Errors
**Problem**: Type mismatches or missing types

**Solutions**:
```bash
# Backend
cd backend
npm run build

# Frontend
cd NeuroScan-landing-page
npm run build
```

#### Hot Reload Not Working
**Problem**: Changes not reflecting

**Solutions**:
1. Restart dev server
2. Clear browser cache
3. Check file watcher limits (Linux):
```bash
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### 10. Production Deployment Issues

#### Environment Variables Not Loading
**Problem**: .env file not being read

**Solutions**:
1. Ensure .env file exists
2. Check file permissions
3. Use absolute path for .env
4. Set environment variables directly

#### Build Failures
**Problem**: Build process fails

**Solutions**:
```bash
# Clear caches
rm -rf node_modules dist .next
npm install
npm run build
```

## Debugging Tips

### Backend Debugging
```bash
# Enable detailed logging
NODE_ENV=development npm run dev

# Check MongoDB connection
mongosh
use neuroscan
db.sessions.find().pretty()

# Test API endpoints
curl http://localhost:3001/api/health
```

### Frontend Debugging
```javascript
// Add to Chat.tsx or Report.tsx
console.log('Session ID:', sessionId);
console.log('Messages:', messages);
console.log('Phase:', phase);
```

### Network Debugging
```bash
# Check if backend is accessible
curl http://localhost:3001/api/health

# Check CORS
curl -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS http://localhost:3001/api/session/start
```

## Getting Help

If you're still experiencing issues:

1. **Check Logs**:
   - Backend: Terminal running `npm run dev`
   - Frontend: Browser console (F12)
   - MongoDB: `/usr/local/var/log/mongodb/mongo.log`

2. **Verify Setup**:
   - Follow SETUP.md step by step
   - Ensure all prerequisites are installed
   - Check all environment variables

3. **Test Components**:
   - Test backend: `curl http://localhost:3001/api/health`
   - Test MongoDB: `mongosh` then `show dbs`
   - Test OpenAI: Check API key at platform.openai.com

4. **Common Fixes**:
   - Restart everything
   - Clear all caches
   - Reinstall dependencies
   - Check for typos in .env

## Quick Reset

If all else fails, complete reset:

```bash
# Stop all services
pkill -f node
pkill -f vite
brew services stop mongodb-community

# Clean everything
cd NeuroScan-landing-page
rm -rf node_modules package-lock.json
cd backend
rm -rf node_modules package-lock.json dist

# Reinstall
cd ..
npm install
cd backend
npm install

# Reset database
mongosh
use neuroscan
db.dropDatabase()
exit

# Restart services
brew services start mongodb-community
cd backend && npm run dev &
cd .. && npm run dev
```

## Still Need Help?

Check:
- Backend README.md
- API_REFERENCE.md
- SETUP.md
- PROJECT_SUMMARY.md
