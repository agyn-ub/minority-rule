# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Minority Rule Game (Liar Games) implementation on Flow blockchain using Cadence smart contracts and Next.js frontend with FCL integration.

## Key Architecture Insights

### Game Flow Architecture
- **Immediate Start Pattern**: Games start immediately in Round 1 with creator as first player - no lobby waiting
- **Round 1 Special State**: Only round where new players can join while voting is active
- **Vote Privacy Model**: Votes stored privately on-chain, revealed simultaneously after deadline
- **Elimination Algorithm**: Minority voters survive, ties/unanimous = all survive, majority eliminated

### Contract State Machine
```
created → active → votingOpen ↔ processingRound → complete
                        ↑_______________|
```
- `votingOpen`: Primary playing state where votes are collected
- `processingRound`: Temporary state during round result calculation
- Games cycle between votingOpen/processingRound until <3 players remain

### Resource Management Pattern
- Each game is a unique Cadence resource with embedded FlowToken vault for prize pool
- Players stored as structs (not resources) for efficient copying in queries
- Direct vault-to-vault transfers for entry fees and prize distribution

## Development Commands

### Backend/Contract Development
```bash
# Start local Flow emulator
flow emulator start

# Deploy contracts to emulator
flow project deploy --network emulator

# Run comprehensive test suite with coverage
flow test --cover --coverprofile=coverage.lcov

# Execute specific transaction (example)
flow transactions send ./cadence/transactions/create_game.cdc \
  --arg UFix64:10.0 \
  --arg UFix64:300.0 \
  --arg String:"Yes or No?" \
  --network emulator
```

### Frontend Development
```bash
# Navigate to frontend directory
cd frontend/liar-games-web

# Start development server
npm run dev

# Build for production
npm run build

# Deploy contracts from frontend (uses flow.json)
npm run deploy
```

## Critical Implementation Details

### FCL Transaction Pattern
All blockchain interactions follow this pattern:
```typescript
const transactionId = await fcl.mutate({
  cadence: TRANSACTION_CODE,
  args: (arg, t) => [/* typed arguments */],
  limit: 100
});
await fcl.tx(transactionId).onceSealed();
```

### Game State Polling
Frontend polls game state every 5 seconds for real-time updates - see `GameContext.tsx`

### Contract Addresses Configuration
- Emulator: `0xf8d6e0586b0a20c7` (default account)
- Testnet/Mainnet: Set via environment variables in `.env.local`

### Vote Submission Flow
1. Player calls `submitVote` transaction with gameId and bool vote
2. Contract stores vote privately in `currentVotes` mapping
3. After deadline, anyone can call `processRound` to reveal results
4. Eliminated players marked, survivors continue to next round

## Testing Strategy

Three-tier testing approach:
1. **Unit Tests**: Basic contract functions (`MinorityRuleGame_test.cdc`)
2. **Simulation Tests**: Complete game scenarios (`MinorityRuleGame_Simulation_test.cdc`)
3. **Emulator Tests**: Real blockchain environment (`MinorityRuleGame_Emulator_test.cdc`)

## Key Files Reference

### Contract Core
- `cadence/contracts/MinorityRuleGame.cdc` - Main game contract with all logic

### Transactions (State Changes)
- `create_game.cdc` - Create new game instance
- `join_game.cdc` - Join existing game with entry fee
- `submit_vote.cdc` - Submit yes/no vote
- `process_round.cdc` - Process round after deadline
- `claim_prize.cdc` - Claim winner's prize share

### Scripts (Reads)
- `get_all_games.cdc` - List all game IDs
- `get_game_details.cdc` - Full game state including players
- `get_player_game_status.cdc` - Player's status in specific game

### Frontend Integration
- `src/lib/flow/config.ts` - FCL configuration and contract addresses
- `src/contexts/GameContext.tsx` - Central state management and blockchain interaction
- `src/types/game.ts` - TypeScript type definitions matching Cadence structures

## Common Development Patterns

### Adding New Game Features
1. Update contract in `MinorityRuleGame.cdc` with new fields/functions
2. Add corresponding transaction in `cadence/transactions/`
3. Update TypeScript types in `src/types/game.ts`
4. Add frontend interaction in `GameContext.tsx`
5. Write tests in all three test files

### Debugging Failed Transactions
1. Check emulator logs for detailed error messages
2. Verify account has sufficient FLOW balance
3. Confirm contract is deployed to correct address
4. Use scripts to verify current game state before transaction

### Network Switching
Update `.env.local`:
```
NEXT_PUBLIC_FLOW_NETWORK=emulator|testnet|mainnet
NEXT_PUBLIC_FLOW_ACCESS_NODE=<node_url>
NEXT_PUBLIC_MINORITY_RULE_GAME_ADDRESS=<contract_address>
```