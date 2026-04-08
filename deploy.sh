#!/bin/bash

# NeuroScan Vercel Deployment Script
# This script automates the deployment of both frontend and backend to Vercel

set -e  # Exit on error

echo "🚀 NeuroScan Vercel Deployment Script"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI is not installed${NC}"
    echo "Install it with: npm install -g vercel"
    exit 1
fi

echo -e "${GREEN}✅ Vercel CLI found${NC}"
echo ""

# Function to deploy backend
deploy_backend() {
    echo -e "${BLUE}📦 Deploying Backend...${NC}"
    echo "========================"
    
    cd backend
    
    # Check if .env exists
    if [ ! -f .env ]; then
        echo -e "${YELLOW}⚠️  No .env file found in backend${NC}"
        echo "Make sure to set environment variables in Vercel dashboard"
    fi
    
    # Deploy to production
    echo "Deploying to production..."
    vercel --prod --yes
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Backend deployed successfully${NC}"
        echo ""
        echo "Backend URL will be shown above ☝️"
        echo "Copy this URL - you'll need it for the frontend!"
        echo ""
        read -p "Press Enter to continue..."
    else
        echo -e "${RED}❌ Backend deployment failed${NC}"
        exit 1
    fi
    
    cd ..
}

# Function to deploy frontend
deploy_frontend() {
    echo -e "${BLUE}📦 Deploying Frontend...${NC}"
    echo "========================="
    
    # Check if .env.production exists
    if [ ! -f .env.production ]; then
        echo -e "${YELLOW}⚠️  No .env.production file found${NC}"
        echo ""
        read -p "Enter your backend URL (e.g., https://neuroscan-backend-xxx.vercel.app): " BACKEND_URL
        
        if [ -z "$BACKEND_URL" ]; then
            echo -e "${RED}❌ Backend URL is required${NC}"
            exit 1
        fi
        
        echo "VITE_API_URL=$BACKEND_URL" > .env.production
        echo -e "${GREEN}✅ Created .env.production${NC}"
    fi
    
    # Deploy to production
    echo "Deploying to production..."
    vercel --prod --yes
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Frontend deployed successfully${NC}"
        echo ""
        echo "Frontend URL will be shown above ☝️"
    else
        echo -e "${RED}❌ Frontend deployment failed${NC}"
        exit 1
    fi
}

# Function to update CORS
update_cors() {
    echo ""
    echo -e "${BLUE}🔧 Update Backend CORS${NC}"
    echo "====================="
    echo ""
    read -p "Enter your frontend URL (e.g., https://neuroscan-frontend-xxx.vercel.app): " FRONTEND_URL
    
    if [ -z "$FRONTEND_URL" ]; then
        echo -e "${YELLOW}⚠️  Skipping CORS update${NC}"
        return
    fi
    
    cd backend
    echo "Setting CORS_ORIGIN environment variable..."
    vercel env add CORS_ORIGIN production
    echo "$FRONTEND_URL"
    
    echo "Redeploying backend with updated CORS..."
    vercel --prod --yes
    
    echo -e "${GREEN}✅ CORS updated${NC}"
    cd ..
}

# Main deployment flow
main() {
    echo "What would you like to deploy?"
    echo "1) Backend only"
    echo "2) Frontend only"
    echo "3) Both (Backend first, then Frontend)"
    echo "4) Update CORS configuration"
    echo ""
    read -p "Enter your choice (1-4): " choice
    
    case $choice in
        1)
            deploy_backend
            ;;
        2)
            deploy_frontend
            ;;
        3)
            deploy_backend
            echo ""
            deploy_frontend
            echo ""
            read -p "Do you want to update CORS now? (y/n): " update_cors_choice
            if [ "$update_cors_choice" = "y" ] || [ "$update_cors_choice" = "Y" ]; then
                update_cors
            fi
            ;;
        4)
            update_cors
            ;;
        *)
            echo -e "${RED}❌ Invalid choice${NC}"
            exit 1
            ;;
    esac
    
    echo ""
    echo -e "${GREEN}🎉 Deployment Complete!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Test your backend: curl https://your-backend-url.vercel.app/api/health"
    echo "2. Open your frontend URL in a browser"
    echo "3. Create a user account and test the assessment flow"
    echo ""
    echo "For detailed instructions, see DEPLOYMENT_GUIDE.md"
}

# Run main function
main
