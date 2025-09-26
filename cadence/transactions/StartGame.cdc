import MinorityRuleGame from "../contracts/MinorityRuleGame.cdc"

transaction(gameId: UInt64) {

    prepare(signer: AuthAccount) {
        // Transaction signed by game creator
    }

    execute {
        // Get reference to the game
        let game = MinorityRuleGame.borrowGame(gameId)
            ?? panic("Game does not exist")

        // Start the game
        game.startGame()

        log("Game ".concat(gameId.toString()).concat(" has been started"))
    }
}