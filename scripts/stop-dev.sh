#!/bin/bash

# Stop Development Environment Script

echo "🛑 Stopping Liar Games Development Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Stop emulator
if [ -f .emulator.pid ]; then
    EMULATOR_PID=$(cat .emulator.pid)
    if ps -p $EMULATOR_PID > /dev/null 2>&1; then
        echo -e "${YELLOW}Stopping Flow Emulator (PID: $EMULATOR_PID)...${NC}"
        kill $EMULATOR_PID
        rm .emulator.pid
        echo -e "${GREEN}✅ Emulator stopped${NC}"
    else
        echo -e "${YELLOW}Emulator not running${NC}"
        rm .emulator.pid
    fi
else
    # Try to find and kill by process name
    pkill -f "flow emulator" 2>/dev/null
    echo -e "${GREEN}✅ Stopped any running emulator processes${NC}"
fi

# Stop dev wallet
if [ -f .dev-wallet.pid ]; then
    DEV_WALLET_PID=$(cat .dev-wallet.pid)
    if ps -p $DEV_WALLET_PID > /dev/null 2>&1; then
        echo -e "${YELLOW}Stopping Flow Dev Wallet (PID: $DEV_WALLET_PID)...${NC}"
        kill $DEV_WALLET_PID
        rm .dev-wallet.pid
        echo -e "${GREEN}✅ Dev Wallet stopped${NC}"
    else
        echo -e "${YELLOW}Dev Wallet not running${NC}"
        rm .dev-wallet.pid
    fi
else
    # Try to find and kill by process name
    pkill -f "flow dev-wallet" 2>/dev/null
    echo -e "${GREEN}✅ Stopped any running dev-wallet processes${NC}"
fi

# Clean up log files (optional)
if [ -f emulator.log ]; then
    echo -e "${YELLOW}Removing emulator.log...${NC}"
    rm emulator.log
fi

if [ -f dev-wallet.log ]; then
    echo -e "${YELLOW}Removing dev-wallet.log...${NC}"
    rm dev-wallet.log
fi

echo -e "${GREEN}✅ Development environment stopped${NC}"