import MinorityRuleGame from "../contracts/MinorityRuleGame.cdc"

transaction(gameId: UInt64) {

    prepare(signer: auth(Storage) &Account) {
        // Can be called by anyone after deadline
    }

    execute {
        // Get reference to the game
        let game = MinorityRuleGame.borrowGame(gameId)
            ?? panic("Game does not exist")

        // Process the round (will fail if deadline not reached)
        game.processRound()

        log("Processed round ".concat(game.currentRound.toString())
            .concat(" for game ")
            .concat(gameId.toString()))
    }
}