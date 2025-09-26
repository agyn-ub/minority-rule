import MinorityRuleGame from "../contracts/MinorityRuleGame.cdc"

access(all) fun main(gameId: UInt64, player: Address): Bool {
    let game = MinorityRuleGame.borrowGame(gameId)
        ?? panic("Game does not exist")

    return game.hasPlayerVoted(player: player)
}