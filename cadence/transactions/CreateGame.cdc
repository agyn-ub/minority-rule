import MinorityRuleGame from "../contracts/MinorityRuleGame.cdc"

transaction(
    entryFee: UFix64,
    roundDuration: UFix64,
    minPlayers: UInt32,
    maxPlayers: UInt32,
    questionText: String
) {

    prepare(signer: AuthAccount) {
        // Transaction signed by game creator
    }

    execute {
        let gameId = MinorityRuleGame.createGame(
            creator: self.signerAddress,
            entryFee: entryFee,
            roundDuration: roundDuration,
            minPlayers: minPlayers,
            maxPlayers: maxPlayers,
            questionText: questionText
        )

        log("Created new Minority Rule Game with ID: ".concat(gameId.toString()))
    }
}