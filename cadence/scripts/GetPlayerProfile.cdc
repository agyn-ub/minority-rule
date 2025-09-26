import MinorityRuleGame from "../contracts/MinorityRuleGame.cdc"

access(all) fun main(address: Address): {String: AnyStruct}? {
    let profile = MinorityRuleGame.getPlayerProfile(address)
    if profile == nil {
        return nil
    }

    return {
        "address": profile!.address,
        "gamesPlayed": profile!.gamesPlayed,
        "gamesWon": profile!.gamesWon,
        "totalStaked": profile!.totalStaked,
        "totalWinnings": profile!.totalWinnings,
        "roundsSurvived": profile!.roundsSurvived,
        "totalRounds": profile!.totalRounds
    }
}