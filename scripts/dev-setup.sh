#!/bin/bash

# Flow Dev Wallet Setup Script for Liar Games Testing
# This script sets up the complete development environment

echo "🎮 Setting up Liar Games Development Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Flow CLI is installed
if ! command -v flow &> /dev/null; then
    echo -e "${RED}❌ Flow CLI is not installed. Please install it first:${NC}"
    echo "sh -ci \"\$(curl -fsSL https://raw.githubusercontent.com/onflow/flow-cli/master/install.sh)\""
    exit 1
fi

echo -e "${GREEN}✅ Flow CLI found${NC}"

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        return 0
    else
        return 1
    fi
}

# Kill processes on ports if they're already in use
echo "📍 Checking ports..."

if check_port 8888; then
    echo -e "${YELLOW}Port 8888 is in use. Stopping existing emulator...${NC}"
    pkill -f "flow emulator" 2>/dev/null
    sleep 2
fi

if check_port 8701; then
    echo -e "${YELLOW}Port 8701 is in use. Stopping existing dev-wallet...${NC}"
    pkill -f "flow dev-wallet" 2>/dev/null
    sleep 2
fi

# Start Flow Emulator
echo -e "${GREEN}🚀 Starting Flow Emulator...${NC}"
flow emulator start --verbose --log-format=text > emulator.log 2>&1 &
EMULATOR_PID=$!

# Wait for emulator to be ready
echo "⏳ Waiting for emulator to start..."
sleep 5

# Check if emulator is running
if ! check_port 8888; then
    echo -e "${RED}❌ Failed to start emulator. Check emulator.log for details${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Emulator running on port 8888${NC}"

# Deploy contracts
echo -e "${GREEN}📦 Deploying MinorityRuleGame contract...${NC}"
flow project deploy --network emulator

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to deploy contracts${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Contracts deployed successfully${NC}"

# Start Flow Dev Wallet
echo -e "${GREEN}💳 Starting Flow Dev Wallet...${NC}"
flow dev-wallet > dev-wallet.log 2>&1 &
DEV_WALLET_PID=$!

# Wait for dev wallet to be ready
echo "⏳ Waiting for dev wallet to start..."
sleep 5

# Check if dev wallet is running
if ! check_port 8701; then
    echo -e "${RED}❌ Failed to start dev wallet. Check dev-wallet.log for details${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Dev Wallet running on port 8701${NC}"

# Create test accounts function
create_test_account() {
    local NAME=$1
    local AMOUNT=$2
    echo "Creating account: $NAME with $AMOUNT FLOW..."

    # This would normally create accounts, but with dev-wallet they're auto-created
    echo "✅ Account $NAME ready"
}

echo ""
echo -e "${GREEN}🎉 Development environment is ready!${NC}"
echo ""
echo "📝 Quick Start Guide:"
echo "-------------------"
echo "1. Flow Emulator: http://localhost:8888"
echo "2. Dev Wallet:    http://localhost:8701"
echo "3. Start Frontend: cd frontend/liar-games-web && npm run dev"
echo "4. Open Browser:  http://localhost:3000"
echo ""
echo "💡 Dev Wallet will automatically create accounts with 1000 FLOW each"
echo ""
echo "🎮 Test Accounts (auto-created in Dev Wallet):"
echo "  - Account 1: Alice (Game Creator)"
echo "  - Account 2: Bob (Player 2)"
echo "  - Account 3: Charlie (Player 3)"
echo "  - Account 4: Dave (Player 4)"
echo "  - Account 5: Eve (Player 5)"
echo "  - Account 6: Frank (Player 6)"
echo ""
echo "⚠️  To stop all services: ./scripts/stop-dev.sh"
echo ""
echo "Process IDs saved:"
echo "  - Emulator PID: $EMULATOR_PID"
echo "  - Dev Wallet PID: $DEV_WALLET_PID"

# Save PIDs for cleanup script
echo "$EMULATOR_PID" > .emulator.pid
echo "$DEV_WALLET_PID" > .dev-wallet.pid

echo ""
echo -e "${GREEN}Ready for testing! 🎮${NC}"