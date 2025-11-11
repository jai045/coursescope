#!/bin/bash

# CourseScope Quick Deployment to Vercel
# This script automates the deployment process

set -e  # Exit on error

echo "🚀 CourseScope Vercel Quick Deploy"
echo "==================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI not found. Installing...${NC}"
    npm i -g vercel
fi

# Step 1: Build frontend
echo -e "${YELLOW}Step 1: Building frontend...${NC}"
npm run build
if [ -d "dist" ]; then
    echo -e "${GREEN}✅ Frontend built successfully${NC}"
else
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi
echo ""

# Step 2: Verify API structure
echo -e "${YELLOW}Step 2: Verifying API structure...${NC}"
if [ -f "api/_db.py" ] && [ -f "api/majors.py" ]; then
    echo -e "${GREEN}✅ API files found${NC}"
else
    echo -e "${RED}❌ API files missing${NC}"
    exit 1
fi
echo ""

# Step 3: Git push
echo -e "${YELLOW}Step 3: Pushing to GitHub...${NC}"
git add .
git commit -m "chore: prepare for Vercel deployment" || true
git push origin main
echo -e "${GREEN}✅ Pushed to GitHub${NC}"
echo ""

# Step 4: Deploy with Vercel
echo -e "${YELLOW}Step 4: Deploying to Vercel...${NC}"
vercel --prod

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Visit your Vercel dashboard to verify deployment"
echo "2. Set environment variable VITE_API_URL in Vercel settings"
echo "3. Redeploy frontend after setting environment variables"
echo ""
echo "Backend URL: https://your-project.vercel.app/api"
echo "Frontend URL: https://your-project.vercel.app"
