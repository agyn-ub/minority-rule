import MinorityRuleGame from "../contracts/MinorityRuleGame.cdc"

transaction(gameId: UInt64, vote: Bool) {

    let playerAddress: Address

    prepare(signer: auth(Storage) &Account) {
        self.playerAddress = signer.address
    }

    execute {
        // Get reference to the game
        let game = MinorityRuleGame.borrowGame(gameId)
            ?? panic("Game does not exist")

        // Submit vote
        game.submitVote(player: self.playerAddress, vote: vote)

        log("Player ".concat(self.playerAddress.toString())
            .concat(" submitted vote for game ")
            .concat(gameId.toString())
            .concat(" in round ")
            .concat(game.currentRound.toString()))
    }
}