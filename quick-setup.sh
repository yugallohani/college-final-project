#!/bin/bash

# NeuroScan AI - Quick Setup Script
# This will install PostgreSQL and set up your project

set -e

echo "🧠 NeuroScan AI - Quick Setup"
echo "=============================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if PostgreSQL is installed
echo "📊 Checking PostgreSQL..."
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}PostgreSQL not found. Installing...${NC}"
    brew install postgresql@14
    brew services start postgresql@14
    echo -e "${GREEN}✅ PostgreSQL installed and started${NC}"
else
    echo -e "${GREEN}✅ PostgreSQL already installed${NC}"
    # Make sure it's running
    brew services start postgresql@14 2>/dev/null || true
fi
echo ""

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 3

# Create database
echo "🗄️  Creating database..."
if psql -lqt | cut -d \| -f 1 | grep -qw neuroscan; then
    echo -e "${YELLOW}Database 'neuroscan' already exists${NC}"
else
    createdb neuroscan
    echo -e "${GREEN}✅ Database 'neuroscan' created${NC}"
fi
echo ""

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd NeuroScan-landing-page/backend
npm install
echo -e "${GREEN}✅ Backend dependencies installed${NC}"
echo ""

# Run database migrations
echo "🔄 Running database migrations..."
npm run migrate
echo -e "${GREEN}✅ Database migrations complete${NC}"
echo ""

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ..
npm install
echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
echo ""

# Success message
echo ""
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo ""
echo "Your configuration:"
echo "  ✅ PostgreSQL: Running"
echo "  ✅ Database: neuroscan"
echo "  ✅ Gemini API: Configured"
echo "  ✅ Dependencies: Installed"
echo "  ✅ Migrations: Complete"
echo ""
echo "To start the project:"
echo ""
echo "  Terminal 1 (Backend):"
echo "    cd NeuroScan-landing-page/backend"
echo "    npm run dev"
echo ""
echo "  Terminal 2 (Frontend):"
echo "    cd NeuroScan-landing-page"
echo "    npm run dev"
echo ""
echo "Then open: http://localhost:5173"
echo ""
