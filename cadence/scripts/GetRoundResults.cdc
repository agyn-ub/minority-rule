import MinorityRuleGame from "../contracts/MinorityRuleGame.cdc"

access(all) fun main(gameId: UInt64): [MinorityRuleGame.RoundResult] {
    let game = MinorityRuleGame.borrowGame(gameId)
        ?? panic("Game does not exist")

    // Since game is a reference, we need to create a copy of the struct values
    let history: [MinorityRuleGame.RoundResult] = []
    for i in 0..<game.roundHistory.length {
        let roundRef = game.roundHistory[i]
        // Create a new struct instance from the reference
        let roundCopy = MinorityRuleGame.RoundResult(
            round: roundRef.round,
            votes: roundRef.votes,
            minorityChoice: roundRef.minorityChoice,
            eliminated: roundRef.eliminatedPlayers,
            surviving: roundRef.survivingPlayers
        )
        history.append(roundCopy)
    }
    return history
}