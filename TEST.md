# MinorityRuleGame - Comprehensive Test Scenarios

## Game Mechanics Overview

### Core Concept
The Minority Rule Game is a strategic elimination game where players vote on a binary question each round. The minority voters survive while the majority voters are eliminated. This creates a psychological game where players must predict and counter-predict group behavior.

### Key Rules
1. **Entry**: Players join by paying an entry fee that goes into the prize pool
2. **Voting**: Each round, players vote YES or NO on a predetermined question
3. **Elimination**:
   - Minority voters survive to the next round
   - Majority voters are eliminated
   - Non-voters are automatically eliminated
   - In case of a tie (equal YES/NO votes), all voters survive
4. **Victory**: Game ends when fewer than 3 players remain
   - Can have 0, 1, or 2 winners
   - Prize pool is split equally among winners
5. **Edge Cases**:
   - If all players don't vote, no winner is declared
   - If all players vote the same way (unanimous), the round is dismissed and no one is eliminated

### Game States
- `created`: Game initialized, accepting players
- `active`: Minimum players reached, game can start
- `votingOpen`: Current round accepting votes
- `processingRound`: Round being processed, determining eliminations
- `complete`: Game ended, winner determined (or no winner)

## Test Scenarios - Full Game Simulations

### Scenario A: Classic 5-Player Game ✅ IMPLEMENTED
**Setup:**
- 5 players (Alice, Bob, Charlie, Dave, Eve)
- Entry fee: 10 FLOW each
- Prize pool: 50 FLOW
- Round duration: 60 seconds
- Min players: 3, Max players: 10

**Round 1:**
- Alice votes YES
- Bob votes YES
- Charlie votes YES
- Dave votes NO (minority)
- Eve votes NO (minority)
- Result: Dave and Eve survive, others eliminated
- **Game ends**: Only 2 players remain, both are winners

**Actual Result:**
- Dave and Eve both win (split 50 FLOW)
- Game completes after 1 round

**Validations:**
- Event emissions for each player join
- Round start events
- Vote submission events
- Elimination events with correct reasons
- Game completion event with 2 winners
- Player profiles updated correctly

### Scenario B: Minimum Player Game (2 Players) ✅ IMPLEMENTED
**Setup:**
- 2 players (Alice, Bob)
- Entry fee: 20 FLOW each
- Prize pool: 40 FLOW

**Round 1:**
- Alice votes YES
- Bob votes NO
- Result: It's a tie (1 YES, 1 NO), both survive
- **Game ends**: Only 2 players remain, both are winners

**Actual Result:**
- Alice and Bob both win (split 40 FLOW)
- Game completes after 1 round due to tie

**Validations:**
- Quick game resolution
- Single round completion
- Both winners split prize pool
- Stats show both players survived

### Scenario C: Maximum Capacity Game (10 Players) ✅ IMPLEMENTED
**Setup:**
- 10 players
- Entry fee: 5 FLOW each
- Prize pool: 50 FLOW

**Round 1:**
- 7 players vote YES (eliminated)
- 3 players vote NO (survive)

**Round 2:**
- 2 players vote YES (eliminated)
- 1 player votes NO (winner)
- **Game ends**: Only 1 player remains

**Actual Result:**
- Single winner claims full 50 FLOW prize
- Game completes after 2 rounds

**Validations:**
- System handles max players correctly
- Mass elimination processing
- Event emissions scale properly
- Gas usage remains reasonable

### Scenario D: Non-Voter Elimination ✅ IMPLEMENTED
**Setup:**
- 4 players (Alice, Bob, Charlie, Dave)
- Entry fee: 10 FLOW each

**Round 1:**
- Alice votes YES
- Bob votes NO
- Charlie doesn't vote (eliminated)
- Dave doesn't vote (eliminated)
- Result: Alice and Bob survive (tie)
- **Game ends**: Only 2 players remain, both are winners

**Actual Result:**
- Alice and Bob both win (split 40 FLOW)
- Non-voters eliminated, game ends with 2 winners

**Validations:**
- Non-voters properly eliminated
- Timeout enforcement works
- Partial participation handled
- Events show non-voting eliminations
- Game correctly ends with < 3 players

### Scenario E: Tie Scenarios ✅ IMPLEMENTED
**Setup:**
- 4 players
- Entry fee: 10 FLOW each

**Round 1:**
- 2 vote YES
- 2 vote NO
- Result: All survive (tie)

**Round 2:**
- 2 vote YES
- 2 vote NO
- Result: All survive again

**Round 3:**
- 3 vote YES (eliminated)
- 1 votes NO (winner)
- **Game ends**: Only 1 player remains

**Actual Result:**
- Single winner after breaking tie in Round 3
- Shows ties can persist across multiple rounds

**Validations:**
- Ties don't eliminate anyone
- Game continues after ties
- Multiple consecutive ties handled
- Eventually resolves to winner

### Scenario F: Single Survivor Victory Path ✅ IMPLEMENTED
**Setup:**
- 6 players
- Entry fee: 10 FLOW each
- Prize pool: 60 FLOW

**Expected Flow:**
- Round 1: 6 → 2 survivors (4 eliminated)
- **Game would end**: Only 2 players remain

**Note:** With new rules, game would end after Round 1 with 2 winners

**Validations:**
- Progressive elimination tracking
- Round history maintained
- Each player's elimination round recorded
- Winner's complete voting history preserved

### Scenario G: No Winners (Nobody Votes) ✅ IMPLEMENTED
**Setup:**
- 3 players
- Entry fee: 10 FLOW each
- Prize pool: 30 FLOW

**Round 1:**
- No players vote (all miss deadline)
- Result: All eliminated for non-voting
- **Game ends**: 0 players remain, no winners

**Actual Result:**
- All players eliminated for not voting
- Game completes with 0 winners
- Prize pool remains unclaimed

**Validations:**
- Edge case handling for no votes
- All players properly eliminated
- Game state properly finalized
- Active players list is empty
- Prize pool cannot be claimed

### Scenario I: Unanimous Voting (Dismissed Round) ✅ IMPLEMENTED
**Setup:**
- 4 players
- Entry fee: 10 FLOW each
- Prize pool: 40 FLOW

**Round 1:**
- All 4 players vote YES
- Unanimous vote detected
- Result: Round dismissed, all survive

**Round 2:**
- All 4 players vote NO
- Unanimous vote detected
- Result: Round dismissed, all survive

**Round 3:**
- 3 players vote YES (eliminated)
- 1 player votes NO (survives)
- Result: Minority wins
- **Game ends**: 1 player remains

**Actual Result:**
- Unanimous rounds don't eliminate anyone
- Game continues until actual minority exists
- Final winner determined in Round 3

**Validations:**
- Unanimous vote detection works
- No eliminations in dismissed rounds
- Game continues properly after dismissed rounds
- Normal minority/majority logic resumes

### Scenario H: Early Game End ✅ IMPLEMENTED
**Setup:**
- 5 players
- Entry fee: 10 FLOW each

**Round 1:**
- 1 player votes YES (minority)
- 4 players vote NO (eliminated)
- Result: Immediate winner in round 1
- **Game ends**: Only 1 player remains

**Validations:**
- Quick game resolution
- Single round stats
- Mass elimination in one round
- Prize immediately claimable

## Integration Test Implementation

### Test Setup Requirements
```cadence
// Test accounts needed
- Admin account (contract deployer)
- 10 test player accounts
- Each with 100+ FLOW tokens
- Proper FlowToken vault setup
```

### Helper Functions Required
```cadence
// Game Management
- createGame(params) -> gameId
- joinGameAsPlayer(player, gameId, fee)
- startGameWithPlayers(gameId, players)
- advanceToNextRound(gameId)

// Voting Helpers
- submitVotes(gameId, votesMap)
- simulateTimeout(gameId)
- processRoundWithDeadline(gameId)

// Verification Helpers
- verifyActivePlayers(gameId, expectedPlayers)
- verifyEliminated(gameId, players, round)
- verifyRoundResults(gameId, round, expected)
- verifyGameWinner(gameId, winner)
- verifyPrizeClaimed(gameId, amount)

// Event Helpers
- captureEvents(txResult) -> events
- verifyEventEmitted(events, eventType, fields)
- verifyEventSequence(events, expectedOrder)

// State Helpers
- getGameState(gameId) -> GameState
- getPlayerStats(address) -> PlayerProfile
- getRoundHistory(gameId) -> [RoundResult]
```

### Test Execution Strategy

1. **Setup Phase**
   - Deploy contracts
   - Initialize test accounts
   - Fund accounts with FlowToken

2. **Scenario Execution**
   - Each scenario in isolated test function
   - Clear event logs between scenarios
   - Reset game counter if needed

3. **Validation Phase**
   - Check all state changes
   - Verify event emissions
   - Validate player profiles
   - Confirm prize distributions

4. **Cleanup Phase**
   - Document test results
   - Log any gas usage metrics
   - Clear test data

## Expected Test Coverage

### Contract Functions
- ✅ createGame()
- ✅ joinGame()
- ✅ startGame()
- ✅ submitVote()
- ✅ processRound()
- ✅ claimPrize()
- ✅ All view functions

### Game States
- ✅ created → active
- ✅ active → votingOpen
- ✅ votingOpen → processingRound
- ✅ processingRound → votingOpen (next round)
- ✅ processingRound → complete

### Edge Cases
- ✅ Minimum players (2)
- ✅ Maximum players
- ✅ All players tie
- ✅ No votes submitted
- ✅ Partial votes
- ✅ Single round games
- ✅ Extended multi-round games
- ✅ No winner scenarios

### Security Tests
- ✅ Double voting prevention
- ✅ Join after start prevention
- ✅ Vote after deadline prevention
- ✅ Prize claim by non-winner prevention
- ✅ Reentrancy protection

## Performance Metrics

### Expected Gas Usage
- Game creation: ~X units
- Player join: ~X units
- Vote submission: ~X units
- Round processing (5 players): ~X units
- Round processing (10 players): ~X units
- Prize claim: ~X units

### Scalability Targets
- Support 100+ concurrent games
- Handle 20+ players per game
- Process rounds in < 2 seconds
- Events emission < 1000 per round

## Test Implementation Status

### Implemented Tests (9/9) ✅ ALL SCENARIOS IMPLEMENTED
- ✅ Scenario A: Classic 5-Player Game
- ✅ Scenario B: Minimum Player Game (2 Players)
- ✅ Scenario C: Maximum Capacity Game (10 Players)
- ✅ Scenario D: Non-Voter Elimination
- ✅ Scenario E: Tie Scenarios
- ✅ Scenario F: Single Survivor Victory Path
- ✅ Scenario G: No Winners (Nobody Votes)
- ✅ Scenario H: Early Game End
- ✅ Scenario I: Unanimous Voting (Dismissed Round)

### Test Files
- **Basic Tests**: `cadence/tests/MinorityRuleGame_test.cdc`
- **Simulation Tests**: `cadence/tests/MinorityRuleGame_Simulation_test.cdc`

## Test Execution Commands

```bash
# Run basic tests
flow test cadence/tests/MinorityRuleGame_test.cdc

# Run simulation tests
flow test cadence/tests/MinorityRuleGame_Simulation_test.cdc

# Run with coverage
flow test --cover --coverprofile=coverage.lcov

# Run specific scenario
flow test -f "testScenarioA"
```

## Success Criteria

1. All test scenarios pass
2. Code coverage > 90%
3. No security vulnerabilities found
4. Gas usage within acceptable limits
5. Event emissions match expected patterns
6. State transitions properly validated
7. Edge cases handled gracefully
8. Player profiles accurately updated
9. Prize distribution works correctly
10. No resource leaks detected