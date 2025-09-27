# 🎮 Liar Games - Minority Rule Game on Flow Blockchain

A decentralized social deduction game built on Flow blockchain where players must vote with the minority to survive elimination rounds and win the prize pool.

## 🎯 Overview

Liar Games is an on-chain implementation of the Minority Rule Game where players compete by trying to vote with the minority group. In each round, players vote YES or NO on a question. The majority voters are eliminated while minority voters survive to the next round. The last remaining players split the prize pool.

### Key Features

- **Immediate Start**: Games begin instantly with the creator as the first player - no waiting in lobbies
- **Real-time FLOW Balance**: Live balance updates showing your FLOW tokens
- **Decentralized Prize Pool**: All entry fees stored in smart contract vault
- **Transparent Voting**: Votes are revealed simultaneously after deadline
- **Fair Distribution**: Winners split the prize pool equally
- **On-chain History**: Complete game history stored on blockchain

## 🎲 Game Mechanics

1. **Game Creation**: Creator sets entry fee, round duration, and question
2. **Joining**: Players join by paying the entry fee (Round 1 only)
3. **Voting Phase**: Players vote YES or NO on the question
4. **Round Processing**: After deadline, votes are revealed
5. **Elimination**: Majority voters are eliminated, minority survives
6. **Special Cases**:
   - Tie votes: All players survive
   - Unanimous votes: All players survive
7. **Game End**: When fewer than 3 players remain
8. **Prize Claim**: Winners claim their share of the prize pool

## 🛠 Tech Stack

- **Blockchain**: Flow Blockchain
- **Smart Contracts**: Cadence
- **Frontend**: Next.js 15, React 19, TypeScript
- **Wallet Integration**: Flow Client Library (FCL)
- **Styling**: Tailwind CSS
- **Token**: FLOW (native token)

## 📋 Prerequisites

- [Flow CLI](https://developers.flow.com/tools/flow-cli/install) (v1.0+)
- [Node.js](https://nodejs.org/) (v18+)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/liar_games.git
cd liar_games
```

### 2. Start Flow Emulator

```bash
# Terminal 1: Start the Flow emulator
flow emulator start

# Terminal 2: Start the dev wallet (optional, for UI wallet)
flow dev-wallet
```

### 3. Deploy Smart Contracts

```bash
# Deploy contracts to emulator
flow project deploy --network emulator
```

### 4. Setup Frontend

```bash
# Navigate to frontend directory
cd frontend/liar-games-web

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Start development server
npm run dev
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Dev Wallet**: http://localhost:8701

## 📝 Smart Contract Architecture

### Main Contract: `MinorityRuleGame.cdc`

The contract manages all game logic with the following key components:

#### Resources
- **Game**: Individual game instance with embedded FlowToken vault
- **Player**: Struct tracking player state and voting history

#### State Machine
```
created → active → votingOpen ↔ processingRound → complete
                       ↑_______________|
```

#### Key Functions
- `createGame()`: Create new game instance with entry fee
- `joinGame()`: Join existing game (Round 1 only)
- `submitVote()`: Submit YES/NO vote for current round
- `processRound()`: Process round results after deadline
- `processRoundAsCreator()`: Creator bypass for immediate processing
- `claimPrize()`: Claim winner's prize share

## 🎮 Frontend Architecture

### Core Components

```
src/
├── app/                    # Next.js app router pages
│   ├── page.tsx           # Home page with game list
│   └── game/[gameId]/     # Individual game page
├── components/
│   ├── Navbar.tsx         # Navigation with wallet & balance
│   ├── GameList.tsx       # List of all games
│   ├── CreateGame.tsx     # Game creation form
│   └── RoundTimer.tsx     # Countdown timer
├── contexts/
│   ├── AuthContext.tsx    # Wallet authentication & balance
│   └── GameContext.tsx    # Game state management
└── lib/
    └── flow/
        └── config.ts      # FCL configuration
```

### State Management

- **AuthContext**: Handles wallet connection and FLOW balance
- **GameContext**: Manages game data and blockchain interactions

## 🧪 Testing

The project includes comprehensive test coverage:

```bash
# Run all tests
flow test --cover

# Run specific test file
flow test cadence/tests/MinorityRuleGame_test.cdc

# Generate coverage report
flow test --cover --coverprofile=coverage.lcov
```

### Test Structure
- **Unit Tests**: Basic contract functions
- **Simulation Tests**: Complete game scenarios
- **Emulator Tests**: Real blockchain environment

## 📜 Available Scripts

### Backend (Cadence)
```bash
flow emulator start           # Start local blockchain
flow project deploy           # Deploy contracts
flow test                     # Run tests
flow scripts execute [script] # Run scripts
flow transactions send [tx]   # Send transactions
```

### Frontend (Next.js)
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run linter
```

## 🔧 Configuration

### Environment Variables

Create `.env.local` in the frontend directory:

```env
# Network configuration (emulator|testnet|mainnet)
NEXT_PUBLIC_FLOW_NETWORK=emulator

# Flow Access Node
NEXT_PUBLIC_FLOW_ACCESS_NODE=http://localhost:8888

# Contract addresses
NEXT_PUBLIC_MINORITY_RULE_GAME_ADDRESS=0xf8d6e0586b0a20c7
```

### Flow Configuration

The `flow.json` file contains:
- Contract deployments
- Account configurations
- Network settings
- Dependencies

## 🚢 Deployment

### Emulator (Local)
```bash
flow emulator start
flow project deploy --network emulator
```

### Testnet
```bash
flow project deploy --network testnet
```

### Mainnet
```bash
flow project deploy --network mainnet
```

## 📚 API Reference

### Transactions

| Transaction | Description | Parameters |
|------------|-------------|------------|
| `CreateGame` | Create new game | `entryFee`, `roundDuration`, `questionText` |
| `JoinGame` | Join existing game | `gameId`, `entryFee` |
| `SubmitVote` | Submit vote | `gameId`, `vote` |
| `ProcessRound` | Process round results | `gameId` |
| `ClaimPrize` | Claim winner prize | `gameId` |

### Scripts (Read-only)

| Script | Description | Returns |
|--------|-------------|---------|
| `GetAllGames` | List all game IDs | `[UInt64]` |
| `GetGameInfo` | Get game details | `GameInfo` |
| `GetGameState` | Get current state | `GameState` |
| `HasPlayerVoted` | Check vote status | `Bool` |
| `GetFlowBalance` | Get FLOW balance | `UFix64` |

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style and conventions
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

## 🐛 Known Issues

- Emulator time may lag behind real time, use creator bypass for testing
- Balance updates may take a few seconds to reflect
- Maximum players per game limited by gas constraints

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Flow Team for blockchain infrastructure
- Cadence community for smart contract patterns
- ETHDenver hackathon for the opportunity

## 📞 Contact & Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/yourusername/liar_games/issues)
- **Flow Discord**: [Join the community](https://discord.gg/flow)
- **Documentation**: [Flow Docs](https://developers.flow.com/)

## 🚀 Roadmap

- [ ] Mobile responsive design improvements
- [ ] Multiple game modes (different voting mechanics)
- [ ] Tournament system
- [ ] Leaderboard and statistics
- [ ] NFT rewards for winners
- [ ] Custom token support
- [ ] Social features (chat, profiles)

---

Built with ❤️ on Flow Blockchain