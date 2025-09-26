import MinorityRuleGame from "../contracts/MinorityRuleGame.cdc"

access(all) fun main(gameId: UInt64, playerAddress: Address): {String: AnyStruct}? {
    let game = MinorityRuleGame.borrowGame(gameId)
    if game == nil {
        return nil
    }

    let gameRef = game!
    let player = gameRef.players[playerAddress]
    if player == nil {
        return nil
    }

    return {
        "address": player!.address,
        "joinedAt": player!.joinedAt,
        "isActive": player!.isActive,
        "eliminatedRound": player!.eliminatedRound,
        "votingHistory": player!.votingHistory,
        "hasVoted": gameRef.hasPlayerVoted(player: playerAddress)
    }
}