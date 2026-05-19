#!/bin/bash

# ==============================================================================
# 🚀 AUTOMATED UBUNTU SERVER DEPLOYMENT DAEMON
# File: deploy.sh
# Usage: chmod +x deploy.sh && ./deploy.sh
# ==============================================================================

# ANSI Color Codes
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0;5m' # No Color
RESET='\033[0m'

# Track build statuses
STATUS_MAIN="SKIPPED"
STATUS_INSYS="SKIPPED"

echo -e "${CYAN}=======================================================${RESET}"
echo -e "${YELLOW}🔄 STARTING WALKDROBE PRODUCTION SYSTEM DEPLOYMENT 🔄${RESET}"
echo -e "${CYAN}=======================================================${RESET}"

# 1. Pull latest Git updates
echo -e "\n${CYAN}[1/5] Pulling latest code changes from Git...${RESET}"
git pull
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✔ Git pull successful!${RESET}"
else
    echo -e "${RED}❌ Git pull failed. Please check your SSH keys or network connection.${RESET}"
    exit 1
fi

# 2. Build Customer E-commerce System (main-web)
if [ -d "./main-web" ]; then
    echo -e "\n${CYAN}[2/5] Building Customer E-commerce Platform (main-web)...${RESET}"
    cd main-web
    
    echo -e "${YELLOW}⏳ Installing main-web packages...${RESET}"
    npm install --quiet
    
    echo -e "${YELLOW}⏳ Compiling optimized Next.js build...${RESET}"
    npm run build
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✔ main-web compiled successfully!${RESET}"
        STATUS_MAIN="SUCCESS"
    else
        echo -e "${RED}❌ main-web compilation failed. Halting deployment to prevent server crash.${RESET}"
        exit 1
    fi
    cd ..
fi

# 3. Build Administrative Panel (insys)
if [ -d "./insys" ]; then
    echo -e "\n${CYAN}[3/5] Building Admin Panel & Offline Store (insys)...${RESET}"
    cd insys
    
    echo -e "${YELLOW}⏳ Installing insys packages...${RESET}"
    npm install --quiet
    
    echo -e "${YELLOW}⏳ Compiling Next.js build...${RESET}"
    npm run build
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✔ insys compiled successfully!${RESET}"
        STATUS_INSYS="SUCCESS"
    else
        echo -e "${RED}❌ insys compilation failed. Halting deployment to prevent server crash.${RESET}"
        exit 1
    fi
    cd ..
fi

# 4. Restart Server Daemons via PM2
echo -e "\n${CYAN}[4/5] Restarting production daemons via PM2...${RESET}"

# Verify PM2 is installed and active
if command -v pm2 &> /dev/null; then
    # Restart using the ecosystem config if present
    if [ -f "./main-web/ecosystem.config.js" ]; then
        echo -e "${YELLOW}⏳ Restarting walkdrobe apps via ecosystem config...${RESET}"
        pm2 restart ./main-web/ecosystem.config.js --env production
    else
        echo -e "${YELLOW}⏳ Restarting all active PM2 threads...${RESET}"
        pm2 restart all
    fi
    echo -e "${GREEN}✔ PM2 processes restarted successfully!${RESET}"
else
    echo -e "${YELLOW}⚠️  PM2 is not installed globally or not in PATH. Skipping daemon restart.${RESET}"
fi

# 5. Display Active Status Board
echo -e "\n${CYAN}=======================================================${RESET}"
echo -e "${GREEN}🎉 DEPLOYMENT FINISHED SUCCESSFULLY!${RESET}"
echo -e "${CYAN}=======================================================${RESET}"
echo -e "📊 Status Board:"
echo -e "   - Customer Store (main-web):  [${GREEN}${STATUS_MAIN}${RESET}]"
echo -e "   - Admin Panel (insys):        [${GREEN}${STATUS_INSYS}${RESET}]"
echo -e "   - Active PM2 Daemons:        [${GREEN}RESTARTED${RESET}]"
echo -e "${CYAN}=======================================================${RESET}\n"

# Verify active PM2 thread list
if command -v pm2 &> /dev/null; then
    pm2 status
fi
