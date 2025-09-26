import Test

access(all) let account = Test.getAccount(0x0000000000000008)

access(all) fun setup() {
    let err = Test.deployContract(
        name: "MinorityRuleGame",
        path: "../contracts/MinorityRuleGame.cdc",
        arguments: []
    )
    Test.expect(err, Test.beNil())
}

access(all) fun testContractDeployment() {
    // Test that contract is deployed
    let scriptCode = "import MinorityRuleGame from 0x0000000000000008\naccess(all) fun main(): UInt64 { return MinorityRuleGame.nextGameId }"
    let scriptResult = Test.executeScript(scriptCode, [])

    Test.expect(scriptResult, Test.beSucceeded())
    Test.assertEqual(1 as UInt64, scriptResult.returnValue! as! UInt64)
}

access(all) fun testCreateGame() {
    let code = "import MinorityRuleGame from 0x0000000000000008\n\ntransaction { execute { let gameId = MinorityRuleGame.createGame(creator: 0x01, entryFee: 10.0, roundDuration: 60.0, minPlayers: 2, maxPlayers: 5, questionText: \"Test?\") } }"

    let tx = Test.Transaction(
        code: code,
        authorizers: [],
        signers: [],
        arguments: []
    )

    let txResult = Test.executeTransaction(tx)
    Test.expect(txResult, Test.beSucceeded())
}

access(all) fun testGetAllGames() {
    // First create a game
    let createCode = "import MinorityRuleGame from 0x0000000000000008\n\ntransaction { execute { let gameId = MinorityRuleGame.createGame(creator: 0x01, entryFee: 10.0, roundDuration: 60.0, minPlayers: 2, maxPlayers: 5, questionText: \"Test?\") } }"

    let createTx = Test.Transaction(
        code: createCode,
        authorizers: [],
        signers: [],
        arguments: []
    )

    let txResult = Test.executeTransaction(createTx)
    Test.expect(txResult, Test.beSucceeded())

    // Then check games list
    let scriptCode = "import MinorityRuleGame from 0x0000000000000008\naccess(all) fun main(): [UInt64] { return MinorityRuleGame.getAllGames() }"
    let scriptResult = Test.executeScript(scriptCode, [])

    Test.expect(scriptResult, Test.beSucceeded())
    let games = scriptResult.returnValue! as! [UInt64]
    Test.assert(games.length > 0)
}

access(all) fun testBorrowGame() {
    // Create a game first
    let createCode = "import MinorityRuleGame from 0x0000000000000008\n\ntransaction { execute { let gameId = MinorityRuleGame.createGame(creator: 0x01, entryFee: 10.0, roundDuration: 60.0, minPlayers: 2, maxPlayers: 5, questionText: \"Test?\") } }"

    let createTx = Test.Transaction(
        code: createCode,
        authorizers: [],
        signers: [],
        arguments: []
    )

    let txResult = Test.executeTransaction(createTx)
    Test.expect(txResult, Test.beSucceeded())

    // Test borrowing the game
    let scriptCode = "import MinorityRuleGame from 0x0000000000000008\naccess(all) fun main(): Bool { let game = MinorityRuleGame.borrowGame(1); return game != nil }"
    let scriptResult = Test.executeScript(scriptCode, [])

    Test.expect(scriptResult, Test.beSucceeded())
    Test.assertEqual(true, scriptResult.returnValue! as! Bool)
}

access(all) fun testGameState() {
    // Create a game
    let createCode = "import MinorityRuleGame from 0x0000000000000008\n\ntransaction { execute { let gameId = MinorityRuleGame.createGame(creator: 0x01, entryFee: 10.0, roundDuration: 60.0, minPlayers: 2, maxPlayers: 5, questionText: \"Test?\") } }"

    let createTx = Test.Transaction(
        code: createCode,
        authorizers: [],
        signers: [],
        arguments: []
    )

    let txResult = Test.executeTransaction(createTx)
    Test.expect(txResult, Test.beSucceeded())

    // Check game state
    let scriptCode = "import MinorityRuleGame from 0x0000000000000008\naccess(all) fun main(): UInt8 { let game = MinorityRuleGame.borrowGame(1)!; return game.state.rawValue }"
    let scriptResult = Test.executeScript(scriptCode, [])

    Test.expect(scriptResult, Test.beSucceeded())
    Test.assertEqual(0 as UInt8, scriptResult.returnValue! as! UInt8) // Created state
}

access(all) fun testGetActivePlayers() {
    // Create a game
    let createCode = "import MinorityRuleGame from 0x0000000000000008\n\ntransaction { execute { let gameId = MinorityRuleGame.createGame(creator: 0x01, entryFee: 10.0, roundDuration: 60.0, minPlayers: 2, maxPlayers: 5, questionText: \"Test?\") } }"

    let createTx = Test.Transaction(
        code: createCode,
        authorizers: [],
        signers: [],
        arguments: []
    )

    let txResult = Test.executeTransaction(createTx)
    Test.expect(txResult, Test.beSucceeded())

    // Get active players (should be empty initially)
    let scriptCode = "import MinorityRuleGame from 0x0000000000000008\naccess(all) fun main(): Int { let game = MinorityRuleGame.borrowGame(1)!; return game.getActivePlayers().length }"
    let scriptResult = Test.executeScript(scriptCode, [])

    Test.expect(scriptResult, Test.beSucceeded())
    Test.assertEqual(0, scriptResult.returnValue! as! Int)
}

access(all) fun testPlayerProfile() {
    // Check that a player profile doesn't exist initially
    let scriptCode = "import MinorityRuleGame from 0x0000000000000008\naccess(all) fun main(): Bool { return MinorityRuleGame.getPlayerProfile(0x01) == nil }"
    let scriptResult = Test.executeScript(scriptCode, [])

    Test.expect(scriptResult, Test.beSucceeded())
    Test.assertEqual(true, scriptResult.returnValue! as! Bool)
}