import MinorityRuleGame from "../contracts/MinorityRuleGame.cdc"

access(all) fun main(gameId: UInt64): [{String: AnyStruct}]? {
    let game = MinorityRuleGame.borrowGame(gameId)
    if game == nil {
        return nil
    }

    let gameRef = game!
    let playerStats: [{String: AnyStruct}] = []

    for address in gameRef.players.keys {
        let player = gameRef.players[address]!
        let profile = MinorityRuleGame.getPlayerProfile(address)

        playerStats.append({
            "address": address,
            "isActive": player.isActive,
            "eliminatedRound": player.eliminatedRound,
            "votingHistory": player.votingHistory,
            "gamesPlayed": profile?.gamesPlayed ?? 0,
            "gamesWon": profile?.gamesWon ?? 0,
            "totalStaked": profile?.totalStaked ?? 0.0,
            "totalWinnings": profile?.totalWinnings ?? 0.0,
            "survivalRate": profile != nil && profile!.totalRounds > 0
                ? UFix64(profile!.roundsSurvived) / UFix64(profile!.totalRounds)
                : 0.0
        })
    }

    return playerStats
}