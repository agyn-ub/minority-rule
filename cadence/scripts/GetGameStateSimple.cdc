import MinorityRuleGame from "../contracts/MinorityRuleGame.cdc"

// Simplified version for testing that avoids type conversion issues
access(all) fun main(gameId: UInt64): {String: AnyStruct}? {
    let game = MinorityRuleGame.borrowGame(gameId)
    if game == nil {
        return nil
    }

    let gameRef = game!

    // Use string representation for active players to avoid type issues
    let activePlayersList = gameRef.getActivePlayers()
    var activePlayersStr: String = ""
    for i, player in activePlayersList {
        if i > 0 {
            activePlayersStr = activePlayersStr.concat(",")
        }
        activePlayersStr = activePlayersStr.concat(player.toString())
    }

    return {
        "gameId": gameRef.gameId,
        "creator": gameRef.creator,
        "entryFee": gameRef.entryFee,
        "roundDuration": gameRef.roundDuration,
        "minPlayers": gameRef.minPlayers,
        "maxPlayers": gameRef.maxPlayers,
        "questionText": gameRef.questionText,
        "state": gameRef.state.rawValue,
        "currentRound": gameRef.currentRound,
        "roundDeadline": gameRef.roundDeadline,
        "playerCount": gameRef.players.length,
        "activePlayersCount": activePlayersList.length,
        "activePlayersStr": activePlayersStr,
        "timeRemaining": gameRef.getTimeRemaining(),
        "prizePool": gameRef.prizePool.balance
    }
}