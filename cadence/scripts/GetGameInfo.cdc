import MinorityRuleGame from "../contracts/MinorityRuleGame.cdc"

access(all) fun main(gameId: UInt64): MinorityRuleGame.GameInfo? {
    return MinorityRuleGame.getGameInfo(gameId: gameId)
}