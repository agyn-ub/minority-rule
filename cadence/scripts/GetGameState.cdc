import MinorityRuleGame from "../contracts/MinorityRuleGame.cdc"

access(all) fun main(gameId: UInt64): {String: AnyStruct}? {
    let game = MinorityRuleGame.borrowGame(gameId)
    if game == nil {
        return nil
    }

    let gameRef = game!

    // Get active players as typed Address array
    let activePlayersList = gameRef.getActivePlayers()
    let activePlayers: [Address] = []
    for player in activePlayersList {
        activePlayers.append(player)
    }

    let result: {String: AnyStruct} = {
        "gameId": gameRef.gameId,
        "creator": gameRef.creator,
        "entryFee": gameRef.entryFee,
        "roundDuration": gameRef.roundDuration,
        "questionText": gameRef.questionText,
        "state": gameRef.state.rawValue,
        "currentRound": gameRef.currentRound,
        "roundDeadline": gameRef.roundDeadline,
        "playerCount": gameRef.players.length,
        "activePlayers": activePlayers,
        "timeRemaining": gameRef.getTimeRemaining(),
        "prizePool": gameRef.prizePool.balance
    }

    return result
}