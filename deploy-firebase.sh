#!/bin/bash

# Firebase Hosting Deployment Script
# Optimized deployment for Deep Learning Platform

set -e  # Exit on any error

echo "🔥 Starting Firebase Hosting Deployment..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Build the frontend application
echo -e "${BLUE}📦 Building frontend application...${NC}"
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend build successful${NC}"
else
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi

# Step 2: Run Firebase optimization script
echo -e "${BLUE}⚡ Running Firebase optimization...${NC}"
node firebase-optimization.js
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Firebase optimization complete${NC}"
else
    echo -e "${YELLOW}⚠️  Optimization script completed with warnings${NC}"
fi

# Step 3: Install Firebase Functions dependencies
echo -e "${BLUE}📦 Installing Firebase Functions dependencies...${NC}"
cd functions
npm install --production
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Functions dependencies installed${NC}"
else
    echo -e "${RED}❌ Functions dependency installation failed${NC}"
    cd ..
    exit 1
fi

# Step 4: Build Firebase Functions
echo -e "${BLUE}🔧 Building Firebase Functions...${NC}"
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Functions build successful${NC}"
else
    echo -e "${RED}❌ Functions build failed${NC}"
    cd ..
    exit 1
fi

cd ..

# Step 5: Deploy to Firebase Hosting
echo -e "${BLUE}🚀 Deploying to Firebase Hosting...${NC}"
firebase deploy --only hosting
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Hosting deployment successful${NC}"
else
    echo -e "${RED}❌ Hosting deployment failed${NC}"
    exit 1
fi

# Step 6: Deploy Firebase Functions (optional, can be skipped with --hosting-only flag)
if [ "$1" != "--hosting-only" ]; then
    echo -e "${BLUE}🔧 Deploying Firebase Functions...${NC}"
    firebase deploy --only functions
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Functions deployment successful${NC}"
    else
        echo -e "${YELLOW}⚠️  Functions deployment failed, but hosting is live${NC}"
    fi
fi

# Step 7: Performance summary
echo -e "\n${GREEN}🎉 Deployment Complete!${NC}"
echo "=================================================="
echo -e "${BLUE}📊 Performance Optimizations Applied:${NC}"
echo "   • Static asset caching: 1 year"
echo "   • HTML/JSON caching: 1 hour"  
echo "   • Security headers: XSS, CSRF, CSP"
echo "   • Service worker: Offline support"
echo "   • Code splitting: Vendor/UI chunks"
echo "   • Global CDN: Edge caching enabled"
echo "   • Automatic HTTPS: SSL certificates"
echo "   • Compression: Gzip + Brotli"

echo -e "\n${YELLOW}📋 Post-Deployment Checklist:${NC}"
echo "   □ Test website functionality"
echo "   □ Verify ImageKit integration"
echo "   □ Check performance with Lighthouse"
echo "   □ Monitor function logs"
echo "   □ Test mobile responsiveness"

echo -e "\n${BLUE}📚 Useful Commands:${NC}"
echo "   firebase hosting:sites:list    - View hosting sites"
echo "   firebase functions:log         - View function logs"
echo "   firebase serve                 - Test locally"
echo "   firebase deploy --help         - Deploy options"

echo -e "\n${GREEN}🌐 Your site should be live at:${NC}"
echo "https://deep-learning-platform.web.app"
echo "https://deep-learning-platform.firebaseapp.com"
echo ""