#!/bin/bash

# NeuroScan AI - Complete Setup and Run Script
# This script will set up and run both backend and frontend

set -e  # Exit on error

echo "🧠 NeuroScan AI - Complete Setup and Run"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if PostgreSQL is running
echo "📊 Checking PostgreSQL..."
if ! pg_isready -q; then
    echo -e "${RED}❌ PostgreSQL is not running${NC}"
    echo "Please start PostgreSQL first:"
    echo "  brew services start postgresql@14"
    exit 1
fi
echo -e "${GREEN}✅ PostgreSQL is running${NC}"
echo ""

# Check if Node.js is installed
echo "📦 Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node --version) installed${NC}"
echo ""

# Setup Backend
echo "🔧 Setting up Backend..."
cd NeuroScan-landing-page/backend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  No .env file found. Creating from .env.example...${NC}"
    cp .env.example .env
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANT: Please configure your .env file:${NC}"
    echo "1. Set DATABASE_URL to your PostgreSQL connection string"
    echo "2. Set GOOGLE_GEMINI_API_KEY (get free key from https://makersuite.google.com/app/apikey)"
    echo "3. Set JWT_SECRET to a random string"
    echo ""
    echo "Press Enter after you've configured .env..."
    read
fi

# Run database migrations
echo "🗄️  Running database migrations..."
npm run migrate

echo -e "${GREEN}✅ Backend setup complete${NC}"
cd ../..
echo ""

# Setup Frontend
echo "🎨 Setting up Frontend..."
cd NeuroScan-landing-page

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

echo -e "${GREEN}✅ Frontend setup complete${NC}"
cd ..
echo ""

# Start services
echo "🚀 Starting NeuroScan AI..."
echo ""
echo "Starting backend on http://localhost:3001"
echo "Starting frontend on http://localhost:5173"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Start backend in background
cd NeuroScan-landing-page/backend
npm run dev &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

# Start frontend in background
cd ..
npm run dev &
FRONTEND_PID=$!

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
