#!/bin/bash

# NeuroScan AI - Setup Checker
# This script checks if all prerequisites are met

echo "🔍 NeuroScan AI - Setup Checker"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js
echo -n "Checking Node.js... "
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ Found $NODE_VERSION${NC}"
else
    echo -e "${RED}✗ Not found${NC}"
    echo "  Install from: https://nodejs.org/"
fi

# Check npm
echo -n "Checking npm... "
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✓ Found v$NPM_VERSION${NC}"
else
    echo -e "${RED}✗ Not found${NC}"
fi

# Check PostgreSQL
echo -n "Checking PostgreSQL... "
if command -v psql &> /dev/null; then
    PSQL_VERSION=$(psql --version | awk '{print $3}')
    echo -e "${GREEN}✓ Found v$PSQL_VERSION${NC}"
    
    # Check if PostgreSQL is running
    echo -n "Checking if PostgreSQL is running... "
    if pg_isready &> /dev/null; then
        echo -e "${GREEN}✓ Running${NC}"
    else
        echo -e "${RED}✗ Not running${NC}"
        echo "  Start with: brew services start postgresql@15"
    fi
    
    # Check if database exists
    echo -n "Checking if 'neuroscan' database exists... "
    if psql -U postgres -lqt | cut -d \| -f 1 | grep -qw neuroscan; then
        echo -e "${GREEN}✓ Exists${NC}"
    else
        echo -e "${RED}✗ Not found${NC}"
        echo "  Create with: createdb neuroscan"
    fi
else
    echo -e "${RED}✗ Not found${NC}"
    echo "  Install with: brew install postgresql@15"
fi

echo ""
echo "📦 Checking Dependencies"
echo "========================"

# Check backend dependencies
echo -n "Backend dependencies... "
if [ -d "backend/node_modules" ]; then
    echo -e "${GREEN}✓ Installed${NC}"
else
    echo -e "${RED}✗ Not installed${NC}"
    echo "  Run: cd backend && npm install"
fi

# Check frontend dependencies
echo -n "Frontend dependencies... "
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓ Installed${NC}"
else
    echo -e "${RED}✗ Not installed${NC}"
    echo "  Run: npm install"
fi

echo ""
echo "🔑 Checking Configuration"
echo "========================="

# Check .env file
echo -n "Backend .env file... "
if [ -f "backend/.env" ]; then
    echo -e "${GREEN}✓ Exists${NC}"
    
    # Check for required keys
    if grep -q "GOOGLE_GEMINI_API_KEY=" backend/.env; then
        GEMINI_KEY=$(grep "GOOGLE_GEMINI_API_KEY=" backend/.env | cut -d '=' -f2)
        if [ -n "$GEMINI_KEY" ] && [ "$GEMINI_KEY" != "your_gemini_api_key_here" ]; then
            echo -e "  ${GREEN}✓ Gemini API key configured${NC}"
        else
            echo -e "  ${YELLOW}⚠ Gemini API key not set${NC}"
            echo "    Get from: https://makersuite.google.com/app/apikey"
        fi
    fi
    
    if grep -q "HUGGINGFACE_API_KEY=" backend/.env; then
        HF_KEY=$(grep "HUGGINGFACE_API_KEY=" backend/.env | cut -d '=' -f2)
        if [ -n "$HF_KEY" ] && [ "$HF_KEY" != "your_huggingface_api_key_here" ]; then
            echo -e "  ${GREEN}✓ HuggingFace API key configured${NC}"
        else
            echo -e "  ${YELLOW}⚠ HuggingFace API key not set${NC}"
            echo "    Get from: https://huggingface.co/settings/tokens"
        fi
    fi
else
    echo -e "${RED}✗ Not found${NC}"
    echo "  Create with: cd backend && cp .env.example .env"
fi

echo ""
echo "🌐 Checking Ports"
echo "================="

# Check if port 3001 is available
echo -n "Port 3001 (Backend)... "
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${YELLOW}⚠ In use${NC}"
    echo "  Kill with: lsof -ti:3001 | xargs kill -9"
else
    echo -e "${GREEN}✓ Available${NC}"
fi

# Check if port 5173 is available
echo -n "Port 5173 (Frontend)... "
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${YELLOW}⚠ In use${NC}"
    echo "  Kill with: lsof -ti:5173 | xargs kill -9"
else
    echo -e "${GREEN}✓ Available${NC}"
fi

echo ""
echo "📊 Summary"
echo "=========="

# Count checks
TOTAL_CHECKS=10
PASSED_CHECKS=0

command -v node &> /dev/null && ((PASSED_CHECKS++))
command -v npm &> /dev/null && ((PASSED_CHECKS++))
command -v psql &> /dev/null && ((PASSED_CHECKS++))
pg_isready &> /dev/null && ((PASSED_CHECKS++))
psql -U postgres -lqt | cut -d \| -f 1 | grep -qw neuroscan && ((PASSED_CHECKS++))
[ -d "backend/node_modules" ] && ((PASSED_CHECKS++))
[ -d "node_modules" ] && ((PASSED_CHECKS++))
[ -f "backend/.env" ] && ((PASSED_CHECKS++))
! lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null && ((PASSED_CHECKS++))
! lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null && ((PASSED_CHECKS++))

echo "Passed: $PASSED_CHECKS/$TOTAL_CHECKS checks"

if [ $PASSED_CHECKS -eq $TOTAL_CHECKS ]; then
    echo -e "${GREEN}✓ All checks passed! Ready to start.${NC}"
    echo ""
    echo "Start the application:"
    echo "  Terminal 1: cd backend && npm run dev"
    echo "  Terminal 2: npm run dev"
elif [ $PASSED_CHECKS -ge 7 ]; then
    echo -e "${YELLOW}⚠ Most checks passed. Review warnings above.${NC}"
else
    echo -e "${RED}✗ Several checks failed. Please fix issues above.${NC}"
fi

echo ""
echo "For detailed setup instructions, see: QUICK_START.md"
