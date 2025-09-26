import MinorityRuleGame from "../contracts/MinorityRuleGame.cdc"

access(all) fun main(): [UInt64] {
    return MinorityRuleGame.getAllGames()
}