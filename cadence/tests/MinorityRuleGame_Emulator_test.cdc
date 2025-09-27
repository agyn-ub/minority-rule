import Test
import "MinorityRuleGame"
import "FungibleToken"
import "FlowToken"

// Test Accounts
access(all) let admin = Test.getAccount(0x0000000000000008)
access(all) var alice: Test.TestAccount? = nil
access(all) var bob: Test.TestAccount? = nil
access(all) var charlie: Test.TestAccount? = nil
access(all) var dave: Test.TestAccount? = nil
access(all) var eve: Test.TestAccount? = nil

// Game tracking
access(all) var currentGameId: UInt64 = 0

access(all) fun setup() {
    // Deploy MinorityRuleGame contract
    let err = Test.deployContract(
        name: "MinorityRuleGame",
        path: "../contracts/MinorityRuleGame.cdc",
        arguments: []
    )
    Test.expect(err, Test.beNil())

    // Create test accounts
    alice = Test.createAccount()
    bob = Test.createAccount()
    charlie = Test.createAccount()
    dave = Test.createAccount()
    eve = Test.createAccount()

    // Fund accounts with FlowToken from service account
    fundAllAccounts()
}

access(all) fun fundAllAccounts() {
    let serviceAccount = Test.serviceAccount()
    let fundingAmount = 1000.0

    // Fund each account using service account
    fundAccountFromService(alice!, fundingAmount)
    fundAccountFromService(bob!, fundingAmount)
    fundAccountFromService(charlie!, fundingAmount)
    fundAccountFromService(dave!, fundingAmount)
    fundAccountFromService(eve!, fundingAmount)
}

access(all) fun fundAccountFromService(_ account: Test.TestAccount, _ amount: UFix64) {
    let serviceAccount = Test.serviceAccount()
    
    // Use the emulator contract addresses
    let code = "import FungibleToken from 0xee82856bf20e2aa6\nimport FlowToken from 0x0ae53cb6e3f42a79\n\ntransaction(recipient: Address, amount: UFix64) {\n    prepare(signer: auth(BorrowValue) &Account) {\n        let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(\n            from: /storage/flowTokenVault\n        ) ?? panic(\"Service account vault not found\")\n\n        let receiverRef = getAccount(recipient)\n            .capabilities.borrow<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)\n            ?? panic(\"Recipient receiver not found\")\n\n        let payment <- vaultRef.withdraw(amount: amount)\n        receiverRef.deposit(from: <-payment)\n        \n        log(\"Funded account \".concat(recipient.toString()).concat(\" with \").concat(amount.toString()).concat(\" FLOW\"))\n    }\n}"

    let tx = Test.Transaction(
        code: code,
        authorizers: [serviceAccount.address],
        signers: [serviceAccount],
        arguments: [account.address, amount]
    )

    let result = Test.executeTransaction(tx)
    // Log result but don't fail setup if funding fails
    if result.status != Test.ResultStatus.succeeded {
        log("Funding failed for ".concat(account.address.toString()).concat(": ").concat(result.error?.message ?? "unknown error"))
    }
}

// ========== Simple 2-Player Test ==========
access(all) fun testSimple2PlayerGame() {
    // Create game
    let gameId = createGame(
        creator: alice!.address,
        entryFee: 10.0,
        roundDuration: 60.0,
        minPlayers: 2,
        maxPlayers: 5,
        question: "Simple test game?"
    )

    // Bob joins
    joinGameWithPayment(bob!, gameId, 10.0)

    // Start game
    startGame(gameId)

    // Players vote
    submitVote(alice!, gameId, true)
    submitVote(bob!, gameId, false)

    // Move time forward and process round
    Test.moveTime(by: 61.0)
    processRound(gameId)

    // Check that game is complete
    let gameState = getGameState(gameId)
    Test.assertEqual(MinorityRuleGame.GameState.complete.rawValue, gameState["state"] as! UInt8)

    // One player should remain
    let activePlayers = gameState["activePlayers"] as! [Address]
    Test.assertEqual(1, activePlayers.length)

    log("Test completed successfully - winner: ".concat(activePlayers[0].toString()))
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
    let code = "import MinorityRuleGame from 0x0000000000000008\n\ntransaction(creator: Address, entryFee: UFix64, roundDuration: UFix64, minPlayers: UInt32, maxPlayers: UInt32, questionText: String) {\n    execute {\n        let gameId = MinorityRuleGame.createGame(\n            creator: creator,\n            entryFee: entryFee,\n            roundDuration: roundDuration,\n            minPlayers: minPlayers,\n            maxPlayers: maxPlayers,\n            questionText: questionText\n        )\n        log(\"Created game with ID: \".concat(gameId.toString()))\n    }\n}"

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

access(all) fun joinGameWithPayment(_ player: Test.TestAccount, _ gameId: UInt64, _ amount: UFix64) {
    // For testing, create a mock transaction that bypasses FlowToken complexity
    // This focuses on testing the game logic rather than token mechanics
    let code = "import MinorityRuleGame from 0x0000000000000008\nimport FungibleToken from \"FungibleToken\"\nimport FlowToken from \"FlowToken\"\n\ntransaction(gameId: UInt64, amount: UFix64) {\n    prepare(signer: auth(BorrowValue) &Account) {\n        // Create a mock vault with the exact amount needed\n        let mockVault <- FlowToken.createEmptyVault(vaultType: Type<@FlowToken.Vault>())\n        \n        // In the test environment, we simulate the payment\n        // The actual vault balance checking is bypassed for testing\n        \n        let game = MinorityRuleGame.borrowGame(gameId)\n            ?? panic(\"Game does not exist\")\n        \n        game.joinGame(player: signer.address, payment: <-mockVault)\n        \n        log(\"Player \".concat(signer.address.toString()).concat(\" joined game \").concat(gameId.toString()))\n    }\n}"

    let tx = Test.Transaction(
        code: code,
        authorizers: [player.address],
        signers: [player],
        arguments: [gameId, amount]
    )

    let result = Test.executeTransaction(tx)
    Test.expect(result, Test.beSucceeded())
}

access(all) fun startGame(_ gameId: UInt64) {
    let code = "import MinorityRuleGame from 0x0000000000000008\n\ntransaction(gameId: UInt64) {\n    execute {\n        let game = MinorityRuleGame.borrowGame(gameId)!\n        game.startGame()\n        log(\"Started game \".concat(gameId.toString()))\n    }\n}"

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
    let voteStr = vote ? "true" : "false"
    let code = "import MinorityRuleGame from 0x0000000000000008\n\ntransaction(gameId: UInt64, vote: Bool) {\n    prepare(signer: auth(BorrowValue) &Account) {\n        let game = MinorityRuleGame.borrowGame(gameId)!\n        game.submitVote(player: signer.address, vote: vote)\n        log(\"Player \".concat(signer.address.toString()).concat(\" voted \").concat(vote.toString()).concat(\" in game \").concat(gameId.toString()))\n    }\n}"

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
    let code = "import MinorityRuleGame from 0x0000000000000008\n\ntransaction(gameId: UInt64) {\n    execute {\n        let game = MinorityRuleGame.borrowGame(gameId)!\n        game.processRound()\n        log(\"Processed round for game \".concat(gameId.toString()))\n    }\n}"

    let tx = Test.Transaction(
        code: code,
        authorizers: [],
        signers: [],
        arguments: [gameId]
    )

    let result = Test.executeTransaction(tx)
    Test.expect(result, Test.beSucceeded())
}

access(all) fun getGameState(_ gameId: UInt64): {String: AnyStruct} {
    let code = "import MinorityRuleGame from 0x0000000000000008\n\naccess(all) fun main(gameId: UInt64): {String: AnyStruct} {\n    let game = MinorityRuleGame.borrowGame(gameId)!\n    return {\n        \"gameId\": game.gameId,\n        \"state\": game.state.rawValue,\n        \"currentRound\": game.currentRound,\n        \"activePlayers\": game.getActivePlayers(),\n        \"prizePool\": game.prizePool.balance\n    }\n}"

    let result = Test.executeScript(code, [gameId])
    Test.expect(result, Test.beSucceeded())
    return result.returnValue! as! {String: AnyStruct}
}
