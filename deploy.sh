#!/bin/bash

# ============================================
# WALKDROBE DEPLOY SCRIPT
# Run: npm run deploy
# ============================================

# CONFIG - Change these to match your server
SERVER_USER="root"
SERVER_IP="YOUR_SERVER_IP"
SERVER_PATH="/home/walkdrobe"

echo "🚀 Starting deployment..."

# Step 1: Deploy Convex backend
echo "📦 Deploying Convex..."
cd main-web
npx convex deploy

# Step 2: Build locally
echo "🔨 Building Next.js..."
npm run build

# Step 3: Sync files to server (excluding node_modules, .git, etc)
echo "📤 Uploading to server..."
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '.env.local' \
  --exclude '.next/cache' \
  ./ ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/

# Step 4: Install deps and restart on server
echo "🔄 Restarting server..."
ssh ${SERVER_USER}@${SERVER_IP} "cd ${SERVER_PATH} && npm install --production && pm2 restart walkdrobe"

echo "✅ Deploy complete!"
