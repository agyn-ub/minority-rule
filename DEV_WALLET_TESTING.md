# 🎮 Flow Dev Wallet Testing Guide for Liar Games

## 🚀 Quick Start

### One-Command Setup
```bash
./scripts/dev-setup.sh
```

This will:
1. Start Flow Emulator (port 8888)
2. Deploy MinorityRuleGame contract
3. Start Flow Dev Wallet (port 8701)
4. Create 6 test accounts with 1000 FLOW each

### Start Frontend
```bash
cd frontend/liar-games-web
npm run dev
```

## 🔧 Manual Setup (Step by Step)

### 1. Start Flow Emulator
```bash
flow emulator start
```

### 2. Deploy Contracts
```bash
flow project deploy --network emulator
```

### 3. Start Dev Wallet
```bash
flow dev-wallet
```

### 4. Start Frontend
```bash
cd frontend/liar-games-web
npm run dev
```

## 💳 Using Flow Dev Wallet

### Access Points
- **Dev Wallet UI**: http://localhost:8701
- **Frontend App**: http://localhost:3000
- **Emulator**: http://localhost:8888

### Account Management

Dev Wallet automatically creates accounts. Each account starts with **1000 FLOW tokens**.

#### Test Accounts Setup
1. **Account 1 - Alice**: Game Creator
2. **Account 2 - Bob**: Player 2
3. **Account 3 - Charlie**: Player 3
4. **Account 4 - Dave**: Player 4
5. **Account 5 - Eve**: Player 5
6. **Account 6 - Frank**: Player 6

### Switching Between Accounts

1. Open Dev Wallet UI (http://localhost:8701)
2. Click on account selector in top-right
3. Choose desired account
4. The frontend will automatically detect the account change

## 🎯 Testing Scenarios

### Scenario 1: Basic Game Flow
1. **Alice** creates a game (10 FLOW entry fee)
2. **Bob, Charlie, Dave** join the game
3. **Alice** starts the game
4. Players submit votes:
   - Alice: YES
   - Bob: YES
   - Charlie: NO
   - Dave: NO
5. Process round (tie - all survive)
6. Continue until winner emerges

### Scenario 2: Minority Wins
1. Create game with 5 players
2. 3 players vote YES
3. 2 players vote NO
4. NO voters survive (minority)

### Scenario 3: Non-Voter Elimination
1. Create game with 4 players
2. Only 2 players vote
3. Non-voters are eliminated

### Scenario 4: Unanimous Vote
1. All players vote YES
2. Round is dismissed
3. All players survive

## 🔍 Monitoring Transactions

### In Dev Wallet UI
- Click "Transactions" tab
- View all transactions in real-time
- See transaction details and results

### In Browser Console
```javascript
// Frontend logs FCL configuration
// Check console for transaction IDs and results
```

## 🛠️ Troubleshooting

### Issue: "Cannot connect to wallet"
**Solution**: Ensure Dev Wallet is running on port 8701
```bash
flow dev-wallet
```

### Issue: "Account has insufficient funds"
**Solution**: Dev Wallet accounts start with 1000 FLOW. If depleted:
1. Stop services: `./scripts/stop-dev.sh`
2. Restart: `./scripts/dev-setup.sh`

### Issue: "Contract not deployed"
**Solution**: Deploy contracts
```bash
flow project deploy --network emulator
```

### Issue: "Port already in use"
**Solution**: Kill existing processes
```bash
./scripts/stop-dev.sh
./scripts/dev-setup.sh
```

## 📝 Test Data Examples

### Create Game Parameters
- Entry Fee: 10.0 FLOW
- Min Players: 3
- Max Players: 6
- Round Duration: 60 seconds
- Question: "Will the minority survive?"

### Quick Test Values
- Small game: 3 players, 5 FLOW
- Medium game: 5 players, 10 FLOW
- Large game: 10 players, 20 FLOW

## 🎮 Game Commands Reference

### Frontend Actions
1. **Connect Wallet**: Click "Connect" button
2. **Create Game**: Fill form and submit
3. **Join Game**: Enter game ID and click join
4. **Submit Vote**: Click YES or NO
5. **Process Round**: Click "Process Round" after deadline

### Contract Methods
- `createGame()` - Create new game
- `joinGame()` - Join existing game
- `startGame()` - Start game (creator only)
- `submitVote()` - Submit YES/NO vote
- `processRound()` - Process round results

## 🛑 Stopping Services

### Stop All Services
```bash
./scripts/stop-dev.sh
```

### Manual Stop
```bash
# Stop emulator
pkill -f "flow emulator"

# Stop dev wallet
pkill -f "flow dev-wallet"

# Stop frontend
# Press Ctrl+C in the terminal running npm run dev
```

## 📊 Viewing Game State

### Check Active Games
1. Open browser console (F12)
2. Frontend automatically queries game state
3. View in Dev Wallet transactions

### Monitor Events
- `GameCreated`
- `PlayerJoined`
- `GameStarted`
- `VoteSubmitted`
- `RoundComplete`
- `PlayerEliminated`
- `GameComplete`

## 💡 Tips for Effective Testing

1. **Use multiple browser windows** - One per test account
2. **Keep Dev Wallet UI open** - Monitor transactions
3. **Check browser console** - View FCL logs
4. **Test edge cases** - Invalid actions, edge timing
5. **Monitor FLOW balances** - Verify transfers

## 🔗 Useful Links

- [Flow Emulator Docs](https://developers.flow.com/tools/emulator)
- [Flow Dev Wallet](https://github.com/onflow/fcl-dev-wallet)
- [FCL Documentation](https://developers.flow.com/tools/fcl-js)
- [Cadence Documentation](https://cadence-lang.org)

## 📞 Need Help?

Check the logs:
- Emulator: `emulator.log`
- Dev Wallet: `dev-wallet.log`
- Frontend: Browser console (F12)

---

Happy Testing! 🎮✨