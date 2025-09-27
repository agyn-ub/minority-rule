import MinorityRuleGame from "../contracts/MinorityRuleGame.cdc"

access(all) fun main(gameId: UInt64): [{String: AnyStruct}] {
    let game = MinorityRuleGame.borrowGame(gameId)
        ?? panic("Game does not exist")

    // Convert RoundResult structs to dictionaries for proper type handling
    let results: [{String: AnyStruct}] = []
    for roundResult in game.roundHistory {
        results.append({
            "round": roundResult.round,
            "votes": roundResult.votes,
            "minorityChoice": roundResult.minorityChoice,
            "eliminatedPlayers": roundResult.eliminatedPlayers,
            "survivingPlayers": roundResult.survivingPlayers,
            "timestamp": roundResult.timestamp
        })
    }
    return results
}