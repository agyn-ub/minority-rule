import MinorityRuleGame from "../contracts/MinorityRuleGame.cdc"

transaction(
    entryFee: UFix64,
    roundDuration: UFix64,
    minPlayers: UInt32,
    maxPlayers: UInt32,
    questionText: String
) {
    let creator: Address

    prepare(signer: auth(Storage) &Account) {
        self.creator = signer.address
    }

    execute {
        let gameId = MinorityRuleGame.createGame(
            creator: self.creator,
            entryFee: entryFee,
            roundDuration: roundDuration,
            minPlayers: minPlayers,
            maxPlayers: maxPlayers,
            questionText: questionText
        )

        log("Created new Minority Rule Game with ID: ".concat(gameId.toString()))
    }
}