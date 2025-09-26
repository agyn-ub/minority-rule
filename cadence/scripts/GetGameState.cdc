import MinorityRuleGame from "../contracts/MinorityRuleGame.cdc"

access(all) fun main(gameId: UInt64): {String: AnyStruct}? {
    let game = MinorityRuleGame.borrowGame(gameId)
    if game == nil {
        return nil
    }

    let gameRef = game!

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
        "activePlayers": gameRef.getActivePlayers(),
        "timeRemaining": gameRef.getTimeRemaining(),
        "prizePool": gameRef.prizePool.balance
    }
}