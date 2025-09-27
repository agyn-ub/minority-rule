import Test

// ========== Blockchain Setup ==========
// Note: In Cadence test framework, blockchain is implicitly available
// We don't need to create it explicitly

// Test Accounts (will be initialized in setup)
access(all) var alice: Test.TestAccount? = nil
access(all) var bob: Test.TestAccount? = nil
access(all) var charlie: Test.TestAccount? = nil
access(all) var dave: Test.TestAccount? = nil
access(all) var eve: Test.TestAccount? = nil
access(all) var frank: Test.TestAccount? = nil
access(all) var grace: Test.TestAccount? = nil
access(all) var henry: Test.TestAccount? = nil
access(all) var iris: Test.TestAccount? = nil
access(all) var jack: Test.TestAccount? = nil

// Game tracking
access(all) var currentGameId: UInt64 = 0
access(all) var contractAddress: Address? = nil

access(all) fun setup() {
    // Deploy MinorityRuleGame contract
    let err = Test.deployContract(
        name: "MinorityRuleGame",
        path: "../contracts/MinorityRuleGame.cdc",
        arguments: []
    )
    Test.expect(err, Test.beNil())

    // Use the test deployment address
    contractAddress = 0x0000000000000008

    // Create test accounts
    alice = Test.createAccount()
    bob = Test.createAccount()
    charlie = Test.createAccount()
    dave = Test.createAccount()
    eve = Test.createAccount()
    frank = Test.createAccount()
    grace = Test.createAccount()
    henry = Test.createAccount()
    iris = Test.createAccount()
    jack = Test.createAccount()

    // Test accounts are automatically funded by Test.createAccount()
}

// Funding is not needed - Test.createAccount() provides Flow tokens automatically

// ========== Scenario A: Classic 5-Player Game ==========
access(all) fun testScenarioA_Classic5PlayerGame() {
    // Create game
    let gameId = createGame(
        creator: alice!.address,
        entryFee: 10.0,
        roundDuration: 60.0,
        minPlayers: 3,
        maxPlayers: 10,
        question: "Will the minority survive?"
    )

    // Players join (including Alice)
    joinGame(alice!, gameId, 10.0)
    joinGame(bob!, gameId, 10.0)
    joinGame(charlie!, gameId, 10.0)
    joinGame(dave!, gameId, 10.0)
    joinGame(eve!, gameId, 10.0)

    // Start game
    startGame(gameId)

    // Round 1: 3 YES (eliminated), 2 NO (survive)
    submitVote(alice!, gameId, true)
    submitVote(bob!, gameId, true)
    submitVote(charlie!, gameId, true)
    submitVote(dave!, gameId, false)
    submitVote(eve!, gameId, false)

    // Process round
    Test.moveTime(by: 61.0)
    processRound(gameId)

    // Verify Round 1 results - game should end with 2 winners
    let activePlayers1 = getActivePlayers(gameId)
    Test.assertEqual(2, activePlayers1.length)
    Test.assert(activePlayers1.contains(dave!.address))
    Test.assert(activePlayers1.contains(eve!.address))

    // Game should have ended after Round 1 (less than 3 players)
    let gameState = getGameState(gameId)
    Test.assertEqual(4 as UInt8, gameState["state"] as! UInt8) // Complete state

    // Both Dave and Eve are winners
    let winners = getActivePlayers(gameId)
    Test.assertEqual(2, winners.length)
    Test.assert(winners.contains(dave!.address))
    Test.assert(winners.contains(eve!.address))
}

// ========== Scenario B: Minimum Player Game (2 Players) ==========
access(all) fun testScenarioB_MinimumPlayerGame() {
    let gameId = createGame(
        creator: alice!.address,
        entryFee: 20.0,
        roundDuration: 60.0,
        minPlayers: 2,
        maxPlayers: 5,
        question: "Quick duel?"
    )

    joinGame(alice!, gameId, 20.0)
    joinGame(bob!, gameId, 20.0)
    startGame(gameId)

    // Round 1: Alice YES, Bob NO - it's a tie with 2 players!
    submitVote(alice!, gameId, true)
    submitVote(bob!, gameId, false)

    Test.moveTime(by: 61.0)
    processRound(gameId)

    // With 1 YES and 1 NO, it's a tie - both survive
    // Game should be complete with both as winners (only 2 players)
    let gameState = getGameState(gameId)
    Test.assertEqual(4 as UInt8, gameState["state"] as! UInt8) // Complete state

    let activePlayers = getActivePlayers(gameId)
    Test.assertEqual(2, activePlayers.length)  // Both are winners in a 2-player tie
}

// ========== Scenario C: Maximum Capacity Game ==========
access(all) fun testScenarioC_MaximumCapacityGame() {
    let gameId = createGame(
        creator: alice!.address,
        entryFee: 5.0,
        roundDuration: 60.0,
        minPlayers: 5,
        maxPlayers: 10,
        question: "Max capacity test?"
    )

    // All 10 players join
    joinGame(alice!, gameId, 5.0)
    joinGame(bob!, gameId, 5.0)
    joinGame(charlie!, gameId, 5.0)
    joinGame(dave!, gameId, 5.0)
    joinGame(eve!, gameId, 5.0)
    joinGame(frank!, gameId, 5.0)
    joinGame(grace!, gameId, 5.0)
    joinGame(henry!, gameId, 5.0)
    joinGame(iris!, gameId, 5.0)
    joinGame(jack!, gameId, 5.0)

    startGame(gameId)

    // Round 1: 7 vote YES (eliminated), 3 vote NO (survive)
    submitVote(alice!, gameId, true)
    submitVote(bob!, gameId, true)
    submitVote(charlie!, gameId, true)
    submitVote(dave!, gameId, true)
    submitVote(eve!, gameId, true)
    submitVote(frank!, gameId, true)
    submitVote(grace!, gameId, true)
    submitVote(henry!, gameId, false) // survives
    submitVote(iris!, gameId, false)  // survives
    submitVote(jack!, gameId, false)  // survives

    Test.moveTime(by: 61.0)
    processRound(gameId)

    let activePlayers = getActivePlayers(gameId)
    Test.assertEqual(3, activePlayers.length)
    Test.assert(activePlayers.contains(henry!.address))
    Test.assert(activePlayers.contains(iris!.address))
    Test.assert(activePlayers.contains(jack!.address))

    // Round 2: 2 YES (eliminated), 1 NO (winner)
    submitVote(henry!, gameId, true)
    submitVote(iris!, gameId, true)
    submitVote(jack!, gameId, false)

    Test.moveTime(by: 61.0)
    processRound(gameId)

    let finalGameState = getGameState(gameId)
    Test.assertEqual(4 as UInt8, finalGameState["state"] as! UInt8) // Complete state

    let winner = getActivePlayers(gameId)
    Test.assertEqual(1, winner.length)
    Test.assertEqual(jack!.address, winner[0])
}

// ========== Scenario D: Non-Voter Elimination ==========
access(all) fun testScenarioD_NonVoterElimination() {
    let gameId = createGame(
        creator: alice!.address,
        entryFee: 10.0,
        roundDuration: 60.0,
        minPlayers: 2,
        maxPlayers: 5,
        question: "Will you vote?"
    )

    joinGame(alice!, gameId, 10.0)
    joinGame(bob!, gameId, 10.0)
    joinGame(charlie!, gameId, 10.0)
    joinGame(dave!, gameId, 10.0)

    startGame(gameId)

    // Round 1: Alice YES, Bob NO, Charlie and Dave don't vote
    submitVote(alice!, gameId, true)
    submitVote(bob!, gameId, false)
    // Charlie doesn't vote
    // Dave doesn't vote

    Test.moveTime(by: 61.0)
    processRound(gameId)

    // Charlie and Dave should be eliminated, Alice and Bob survive (tie)
    // Game should end with Alice and Bob as winners (only 2 players left)
    let activePlayers = getActivePlayers(gameId)
    Test.assertEqual(2, activePlayers.length)
    Test.assert(activePlayers.contains(alice!.address))
    Test.assert(activePlayers.contains(bob!.address))
    Test.assert(!activePlayers.contains(charlie!.address))
    Test.assert(!activePlayers.contains(dave!.address))

    // Game should have ended (less than 3 players)
    let finalState = getGameState(gameId)
    Test.assertEqual(4 as UInt8, finalState["state"] as! UInt8) // Complete state

    // Both Alice and Bob are winners
    let winners = getActivePlayers(gameId)
    Test.assertEqual(2, winners.length)
    Test.assert(winners.contains(alice!.address))
    Test.assert(winners.contains(bob!.address))
}

// ========== Scenario E: Tie Scenarios ==========
access(all) fun testScenarioE_TieScenarios() {
    let gameId = createGame(
        creator: alice!.address,
        entryFee: 10.0,
        roundDuration: 60.0,
        minPlayers: 2,
        maxPlayers: 6,
        question: "Tie or not tie?"
    )

    joinGame(alice!, gameId, 10.0)
    joinGame(bob!, gameId, 10.0)
    joinGame(charlie!, gameId, 10.0)
    joinGame(dave!, gameId, 10.0)

    startGame(gameId)

    // Round 1: 2 YES, 2 NO - all survive
    submitVote(alice!, gameId, true)
    submitVote(bob!, gameId, true)
    submitVote(charlie!, gameId, false)
    submitVote(dave!, gameId, false)

    Test.moveTime(by: 61.0)
    processRound(gameId)

    let activePlayers1 = getActivePlayers(gameId)
    Test.assertEqual(4, activePlayers1.length) // All survive in tie

    // Round 2: Another tie
    submitVote(alice!, gameId, false)
    submitVote(bob!, gameId, false)
    submitVote(charlie!, gameId, true)
    submitVote(dave!, gameId, true)

    Test.moveTime(by: 61.0)
    processRound(gameId)

    let activePlayers2 = getActivePlayers(gameId)
    Test.assertEqual(4, activePlayers2.length) // Still all survive

    // Round 3: Break the tie - 3 YES (eliminated), 1 NO (winner)
    submitVote(alice!, gameId, true)
    submitVote(bob!, gameId, true)
    submitVote(charlie!, gameId, true)
    submitVote(dave!, gameId, false)

    Test.moveTime(by: 61.0)
    processRound(gameId)

    let finalState = getGameState(gameId)
    Test.assertEqual(4 as UInt8, finalState["state"] as! UInt8) // Complete state

    let winner = getActivePlayers(gameId)
    Test.assertEqual(1, winner.length)
    Test.assertEqual(dave!.address, winner[0])
}

// ========== Scenario F: Single Survivor Victory Path ==========
access(all) fun testScenarioF_SingleSurvivorPath() {
    let gameId = createGame(
        creator: alice!.address,
        entryFee: 10.0,
        roundDuration: 60.0,
        minPlayers: 3,
        maxPlayers: 10,
        question: "Progressive elimination?"
    )

    // 6 players join
    joinGame(alice!, gameId, 10.0)
    joinGame(bob!, gameId, 10.0)
    joinGame(charlie!, gameId, 10.0)
    joinGame(dave!, gameId, 10.0)
    joinGame(eve!, gameId, 10.0)
    joinGame(frank!, gameId, 10.0)

    startGame(gameId)

    // Round 1: 4 YES (eliminated), 2 NO (survive)
    submitVote(alice!, gameId, true)
    submitVote(bob!, gameId, true)
    submitVote(charlie!, gameId, true)
    submitVote(dave!, gameId, true)
    submitVote(eve!, gameId, false)
    submitVote(frank!, gameId, false)

    Test.moveTime(by: 61.0)
    processRound(gameId)

    // Game should end with 2 winners (Eve and Frank)
    let gameState = getGameState(gameId)
    Test.assertEqual(4 as UInt8, gameState["state"] as! UInt8) // Complete state

    let winners = getActivePlayers(gameId)
    Test.assertEqual(2, winners.length)
    Test.assert(winners.contains(eve!.address))
    Test.assert(winners.contains(frank!.address))
}

// ========== Scenario H: Early Game End ==========
access(all) fun testScenarioH_EarlyGameEnd() {
    let gameId = createGame(
        creator: alice!.address,
        entryFee: 10.0,
        roundDuration: 60.0,
        minPlayers: 3,
        maxPlayers: 10,
        question: "Quick resolution?"
    )

    // 5 players join
    joinGame(alice!, gameId, 10.0)
    joinGame(bob!, gameId, 10.0)
    joinGame(charlie!, gameId, 10.0)
    joinGame(dave!, gameId, 10.0)
    joinGame(eve!, gameId, 10.0)

    startGame(gameId)

    // Round 1: 1 YES (minority), 4 NO (eliminated)
    submitVote(alice!, gameId, true)
    submitVote(bob!, gameId, false)
    submitVote(charlie!, gameId, false)
    submitVote(dave!, gameId, false)
    submitVote(eve!, gameId, false)

    Test.moveTime(by: 61.0)
    processRound(gameId)

    // Game should end with 1 winner (Alice)
    let gameState = getGameState(gameId)
    Test.assertEqual(4 as UInt8, gameState["state"] as! UInt8) // Complete state

    let winners = getActivePlayers(gameId)
    Test.assertEqual(1, winners.length)
    Test.assertEqual(alice!.address, winners[0])
}

// ========== Scenario G: No Winners (Nobody Votes) ==========
access(all) fun testScenarioG_NoWinners() {
    // Create test accounts for this scenario
    let player1 = Test.createAccount()
    let player2 = Test.createAccount()
    let player3 = Test.createAccount()

    let gameId = createGame(
        creator: player1!.address,
        entryFee: 10.0,
        roundDuration: 60.0,
        minPlayers: 3,
        maxPlayers: 10,
        question: "Will anyone vote?"
    )

    // 3 players join
    joinGame(player1!, gameId, 10.0)
    joinGame(player2!, gameId, 10.0)
    joinGame(player3!, gameId, 10.0)

    startGame(gameId)

    // Round 1: Nobody votes - all are eliminated
    // Don't submit any votes

    Test.moveTime(by: 61.0)
    processRound(gameId)

    // Game should end with 0 winners
    let gameState = getGameState(gameId)
    Test.assertEqual(4 as UInt8, gameState["state"] as! UInt8) // Complete state

    let winners = getActivePlayers(gameId)
    Test.assertEqual(0, winners.length) // No winners!
}

// ========== Helper Functions ==========

access(all) fun createGame(
    creator: Address,
    entryFee: UFix64,
    roundDuration: UFix64,
    minPlayers: UInt32,
    maxPlayers: UInt32,
    question: String
): UInt64 {
    let code = "import MinorityRuleGame from ".concat(contractAddress!.toString()).concat("\n\ntransaction(creator: Address, entryFee: UFix64, roundDuration: UFix64, minPlayers: UInt32, maxPlayers: UInt32, questionText: String) {\n    execute {\n        let gameId = MinorityRuleGame.createGame(\n            creator: creator,\n            entryFee: entryFee,\n            roundDuration: roundDuration,\n            minPlayers: minPlayers,\n            maxPlayers: maxPlayers,\n            questionText: questionText\n        )\n    }\n}")

    let tx = Test.Transaction(
        code: code,
        authorizers: [],
        signers: [],
        arguments: [creator, entryFee, roundDuration, minPlayers, maxPlayers, question]
    )

    let result = Test.executeTransaction(tx)
    Test.expect(result, Test.beSucceeded())

    currentGameId = currentGameId + 1
    return currentGameId
}

access(all) fun joinGame(_ player: Test.TestAccount, _ gameId: UInt64, _ amount: UFix64) {
    // Use test-only join function that doesn't require payment
    let code = "import MinorityRuleGame from ".concat(contractAddress!.toString()).concat("\n\ntransaction(gameId: UInt64) {\n    prepare(signer: &Account) {\n        let game = MinorityRuleGame.borrowGame(gameId)\n            ?? panic(\"Game does not exist\")\n        \n        // Use test-only join function\n        game.joinGameTest(player: signer.address)\n    }\n}")

    let tx = Test.Transaction(
        code: code,
        authorizers: [player.address],
        signers: [player],
        arguments: [gameId]
    )

    let result = Test.executeTransaction(tx)
    Test.expect(result, Test.beSucceeded())
}

access(all) fun startGame(_ gameId: UInt64) {
    let code = "import MinorityRuleGame from ".concat(contractAddress!.toString()).concat("\n\ntransaction(gameId: UInt64) {\n    execute {\n        let game = MinorityRuleGame.borrowGame(gameId)!\n        game.startGame()\n    }\n}")

    let tx = Test.Transaction(
        code: code,
        authorizers: [],
        signers: [],
        arguments: [gameId]
    )

    let result = Test.executeTransaction(tx)
    Test.expect(result, Test.beSucceeded())
}

access(all) fun submitVote(_ player: Test.TestAccount, _ gameId: UInt64, _ vote: Bool) {
    let code = Test.readFile("../transactions/SubmitVote.cdc")

    let tx = Test.Transaction(
        code: code,
        authorizers: [player.address],
        signers: [player],
        arguments: [gameId, vote]
    )

    let result = Test.executeTransaction(tx)
    Test.expect(result, Test.beSucceeded())
}

access(all) fun processRound(_ gameId: UInt64) {
    let code = Test.readFile("../transactions/ProcessRound.cdc")

    // Use any account as the signer (alice for consistency)
    let tx = Test.Transaction(
        code: code,
        authorizers: [alice!.address],
        signers: [alice!],
        arguments: [gameId]
    )

    let result = Test.executeTransaction(tx)
    Test.expect(result, Test.beSucceeded())
}

access(all) fun getGameState(_ gameId: UInt64): {String: AnyStruct} {
    let code = Test.readFile("../scripts/GetGameState.cdc")

    let result = Test.executeScript(code, [gameId])
    Test.expect(result, Test.beSucceeded())

    let returnValue = result.returnValue as! {String: AnyStruct}?
    Test.assert(returnValue != nil, message: "Game state should not be nil")

    return returnValue!
}

access(all) fun getActivePlayers(_ gameId: UInt64): [Address] {
    let gameState = getGameState(gameId)
    return gameState["activePlayers"] as! [Address]
}

access(all) fun getRoundResults(_ gameId: UInt64, _ round: UInt32): [{String: AnyStruct}]? {
    let code = Test.readFile("../scripts/GetRoundResults.cdc")

    let result = Test.executeScript(code, [gameId])
    if result.status != Test.ResultStatus.succeeded {
        return nil
    }

    return result.returnValue as? [{String: AnyStruct}]
}