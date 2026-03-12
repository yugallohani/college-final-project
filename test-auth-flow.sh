#!/bin/bash

echo "🧪 Testing NeuroScan AI Authentication Flow"
echo "=========================================="

# Test backend health
echo "1. Testing backend health..."
HEALTH_RESPONSE=$(curl -s http://localhost:3001/api/health)
if [[ $? -eq 0 ]]; then
    echo "✅ Backend is running"
else
    echo "❌ Backend is not responding"
    exit 1
fi

# Test signup with a new user
echo "2. Testing user registration..."
SIGNUP_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:8080" \
  -d '{"email":"testuser'$(date +%s)'@example.com","password":"TestPass123","name":"Test User"}')

if [[ $SIGNUP_RESPONSE == *"accessToken"* ]]; then
    echo "✅ User registration successful"
    # Extract email for login test
    EMAIL=$(echo $SIGNUP_RESPONSE | grep -o '"email":"[^"]*"' | cut -d'"' -f4)
else
    echo "❌ User registration failed"
    echo "Response: $SIGNUP_RESPONSE"
    exit 1
fi

# Test login
echo "3. Testing user login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:8080" \
  -d '{"email":"'$EMAIL'","password":"TestPass123"}')

if [[ $LOGIN_RESPONSE == *"accessToken"* ]]; then
    echo "✅ User login successful"
    # Extract token for verification test
    TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
else
    echo "❌ User login failed"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

# Test token verification
echo "4. Testing token verification..."
VERIFY_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/verify \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:8080" \
  -d '{"token":"'$TOKEN'"}')

if [[ $VERIFY_RESPONSE == *"\"valid\":true"* ]]; then
    echo "✅ Token verification successful"
else
    echo "❌ Token verification failed"
    echo "Response: $VERIFY_RESPONSE"
    exit 1
fi

echo ""
echo "🎉 All authentication tests passed!"
echo ""
echo "📋 Next Steps:"
echo "1. Open http://localhost:8080 in your browser"
echo "2. Click 'Get Started' to go to signup page"
echo "3. Create a new account"
echo "4. You should be redirected to the dashboard"
echo "5. Click 'Start Assessment' to begin the AI evaluation"
echo ""
echo "🔧 If you encounter network errors:"
echo "- Make sure both backend (port 3001) and frontend (port 8080) are running"
echo "- Check browser console for any CORS or network errors"
echo "- Verify PostgreSQL database is running"