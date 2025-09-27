import MinorityRuleGame from "../contracts/MinorityRuleGame.cdc"

transaction(gameId: UInt64) {
    let signerAddress: Address

    prepare(signer: auth(Storage) &Account) {
        self.signerAddress = signer.address
    }

    execute {
        // Get reference to the game
        let game = MinorityRuleGame.borrowGame(gameId)
            ?? panic("Game does not exist")

        // Check if the signer is the creator
        if game.creator == self.signerAddress {
            // Creator can process anytime
            game.processRoundAsCreator(creator: self.signerAddress)
            log("Creator processed round ".concat(game.currentRound.toString())
                .concat(" for game ")
                .concat(gameId.toString()))
        } else {
            // Regular processing (requires deadline to be reached)
            game.processRound()
            log("Processed round ".concat(game.currentRound.toString())
                .concat(" for game ")
                .concat(gameId.toString())
                .concat(" after deadline"))
        }
    }
}