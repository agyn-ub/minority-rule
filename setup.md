# Liar Games Development Setup Guide

## Quick Start Scripts

We have three main scripts to manage your development environment:

### 🛑 `./stop-dev.sh` - Stop All Services
- Stops Flow emulator and frontend server
- **KEEPS your blockchain data and games intact**
- Use when you want to pause development

### 🧹 `./clean-dev.sh` - Clear All Data
- Removes all blockchain data (flowdb directory)
- **DELETES all games and contract state**
- Clears logs and caches
- Use when you want a fresh start

### 🚀 `./start-dev.sh` - Start Development
- Starts Flow emulator
- Deploys contracts
- Starts frontend server
- Use `./start-dev.sh --keep-data` to preserve existing games

## Common Workflows

### Fresh Start (No Old Games)
```bash
# Stop everything and clear all data
./stop-dev.sh && ./clean-dev.sh

# Start with fresh environment
./start-dev.sh
```

### Keep Games Between Sessions
```bash
# Stop services but keep data
./stop-dev.sh

# Later, restart with same games
./start-dev.sh --keep-data
```

### Quick Restart (Clear Everything)
```bash
# One command to stop, clean, and restart
./stop-dev.sh && ./clean-dev.sh && ./start-dev.sh
```

## How Data Persistence Works

### What Gets Saved
- **flowdb/** - Contains all blockchain state, deployed contracts, and game data
- When you stop the emulator normally, this data persists
- Next time you start, all your games will still be there

### What Gets Cleared
Running `./clean-dev.sh` removes:
- `flowdb/` - All blockchain data and games
- `emulator.log` - Emulator logs
- `.flowser/` - Flowser cache
- `frontend/liar-games-web/.next/` - Next.js build cache

## Manual Commands

### Check Service Status
```bash
# Check if emulator is running
ps aux | grep "flow emulator"

# Check if frontend is running
ps aux | grep "npm run dev"

# View emulator logs
tail -f emulator.log

# View frontend logs
tail -f frontend.log
```

### Create a Test Game
```bash
flow transactions send ./cadence/transactions/CreateGame.cdc \
  --arg UFix64:10.0 \
  --arg UFix64:60.0 \
  --arg String:"Will the majority choose YES?" \
  --network emulator \
  --signer emulator-account
```

### Process Round as Creator
With the new update, the game creator can process rounds immediately without waiting:

```bash
flow transactions send ./cadence/transactions/ProcessRound.cdc \
  --arg UInt64:0 \
  --network emulator \
  --signer emulator-account
```

## First Time Setup

1. **Make scripts executable:**
```bash
chmod +x stop-dev.sh clean-dev.sh start-dev.sh
```

2. **Install dependencies:**
```bash
# Install Flow CLI if not installed
sh -ci "$(curl -fsSL https://storage.googleapis.com/flow-cli/install.sh)"

# Install frontend dependencies
cd frontend/liar-games-web
npm install
cd ../..
```

3. **Start development:**
```bash
./start-dev.sh
```

## Troubleshooting

### Port Already in Use
```bash
# Check what's using port 8545 (emulator)
lsof -i :8545

# Check what's using port 3000 (frontend)
lsof -i :3000

# Kill process using a port
kill -9 $(lsof -Pi :3000 -sTCP:LISTEN -t)
```

### Emulator Won't Start
```bash
# Clear data and try again
./clean-dev.sh
./start-dev.sh

# Check logs for errors
tail -100 emulator.log
```

### Contract Deployment Fails
```bash
# For existing contracts, use update flag
flow project deploy --network emulator --update

# Check contract syntax
flow cadence check ./cadence/contracts/*.cdc
```

### Frontend Connection Issues
1. Ensure emulator is running: `ps aux | grep "flow emulator"`
2. Check FCL config in `frontend/liar-games-web/src/config.js`
3. Verify you're accessing `http://localhost:3000`

## Environment Details

- **Flow Emulator**: Runs on port 8888
- **Frontend**: Next.js on port 3000
- **Network**: Local emulator network
- **Default Account**: emulator-account (0xf8d6e0586b0a20c7)