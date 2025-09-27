import MinorityRuleGame from "../contracts/MinorityRuleGame.cdc"

// Returns just the count of active players to avoid empty array type issues
access(all) fun main(gameId: UInt64): UInt32 {
    let game = MinorityRuleGame.borrowGame(gameId)
    if game == nil {
        return 0
    }

    let gameRef = game!
    let activePlayersList = gameRef.getActivePlayers()
    return UInt32(activePlayersList.length)
}