# ✅ Liar Games Testing Checklist

## 🚀 Setup
- [ ] Flow Emulator running (port 8888)
- [ ] Dev Wallet running (port 8701)
- [ ] Contracts deployed
- [ ] Frontend running (port 3000)
- [ ] 6 test accounts created in Dev Wallet

## 👥 Account Setup
- [ ] Account 1 (Alice) - Has 1000 FLOW
- [ ] Account 2 (Bob) - Has 1000 FLOW
- [ ] Account 3 (Charlie) - Has 1000 FLOW
- [ ] Account 4 (Dave) - Has 1000 FLOW
- [ ] Account 5 (Eve) - Has 1000 FLOW
- [ ] Account 6 (Frank) - Has 1000 FLOW

## 🎮 Game Creation
- [ ] Connect wallet as Alice
- [ ] Create game with valid parameters
- [ ] Verify game appears in game list
- [ ] Check Alice's FLOW balance unchanged (creator doesn't pay yet)
- [ ] Note Game ID for joining

## 👥 Player Joining
- [ ] Switch to Bob - Join game
- [ ] Verify Bob's balance decreased by entry fee
- [ ] Switch to Charlie - Join game
- [ ] Verify Charlie's balance decreased by entry fee
- [ ] Switch to Dave - Join game
- [ ] Verify Dave's balance decreased by entry fee
- [ ] Verify player count updates correctly
- [ ] Verify prize pool amount is correct

## 🚦 Game Start
- [ ] Switch to Alice (creator)
- [ ] Alice joins the game (pays entry fee)
- [ ] Start game when minimum players reached
- [ ] Verify game state changes to "VotingOpen"
- [ ] Verify round deadline is set
- [ ] Check all players see voting options

## 🗳️ Voting Phase
- [ ] Alice submits vote (YES/NO)
- [ ] Bob submits vote
- [ ] Charlie submits vote
- [ ] Dave submits vote
- [ ] Verify each vote is recorded
- [ ] Try duplicate vote (should fail)
- [ ] Check time remaining display

## ⚙️ Round Processing
- [ ] Wait for round deadline (or advance time)
- [ ] Process round (any player can trigger)
- [ ] Verify minority players survive
- [ ] Verify majority players eliminated
- [ ] Check round results displayed correctly
- [ ] Verify next round starts (if 3+ players remain)

## 🏆 Game Completion
- [ ] Continue until < 3 players remain
- [ ] Verify game completes automatically
- [ ] Check winner(s) identified correctly
- [ ] Verify prize distribution
- [ ] Winners can claim prizes
- [ ] Check final FLOW balances

## 🧪 Edge Cases

### Tie Scenarios
- [ ] Equal YES and NO votes
- [ ] Verify all players survive
- [ ] Game continues to next round

### Non-Voter Elimination
- [ ] Some players don't vote
- [ ] Non-voters are eliminated
- [ ] Voters proceed based on minority/majority

### Unanimous Voting
- [ ] All players vote YES
- [ ] Round is dismissed
- [ ] All players survive
- [ ] New round starts

### Minimum Players
- [ ] Test with exactly 3 players
- [ ] Test with 2 players (should end)
- [ ] Verify proper game ending

### Maximum Players
- [ ] Test with 6+ players
- [ ] Verify game handles large groups

## 💰 Financial Verification
- [ ] Entry fees collected correctly
- [ ] Prize pool calculated accurately
- [ ] Winner receives correct amount
- [ ] Multiple winners split prize evenly
- [ ] No FLOW tokens lost in system

## 🐛 Error Handling
- [ ] Join already started game (should fail)
- [ ] Join game twice (should fail)
- [ ] Vote twice in same round (should fail)
- [ ] Start game with insufficient players (should fail)
- [ ] Process round before deadline (should fail)
- [ ] Join with insufficient FLOW (should fail)

## 🔄 Multi-Round Testing
- [ ] Play through 3+ rounds
- [ ] Verify round history maintained
- [ ] Check eliminated players stay eliminated
- [ ] Confirm round numbers increment
- [ ] Test various voting patterns

## 📱 User Interface
- [ ] Game list updates in real-time
- [ ] Player count displays correctly
- [ ] Timer countdown works
- [ ] Vote buttons enable/disable appropriately
- [ ] Transaction status messages clear
- [ ] Error messages informative

## 🔍 Dev Wallet Features
- [ ] Account switching works smoothly
- [ ] Transaction history visible
- [ ] Balance updates immediately
- [ ] Multiple accounts can interact
- [ ] No wallet connection issues

## 🎯 Complete Game Scenarios

### Scenario 1: Classic 5-Player Game
- [ ] 5 players join
- [ ] 3 vote YES, 2 vote NO
- [ ] 2 NO voters survive
- [ ] Game ends (< 3 players)
- [ ] Prize split between 2 winners

### Scenario 2: Elimination Cascade
- [ ] 6 players start
- [ ] Round 1: 4 eliminated
- [ ] Round 2: 1 eliminated
- [ ] Single winner takes all

### Scenario 3: No Winners
- [ ] 3 players start
- [ ] Nobody votes
- [ ] All eliminated
- [ ] Game ends with no winners

## 📝 Final Verification
- [ ] All test scenarios completed
- [ ] No unexpected errors encountered
- [ ] FLOW balances reconcile
- [ ] Game states transition correctly
- [ ] UI reflects all changes
- [ ] Events emit properly

## 📊 Performance Testing
- [ ] Rapid voting from multiple accounts
- [ ] Quick succession of games
- [ ] Large game with max players
- [ ] Network latency handling
- [ ] Transaction confirmation times

---

## Test Summary
- Total Tests: ___/___
- Tests Passed: ___
- Tests Failed: ___
- Issues Found: ___

### Notes:
_Add any observations, bugs, or improvements here_

---

✨ Testing Complete: [ ]
Date: ___________
Tester: ___________