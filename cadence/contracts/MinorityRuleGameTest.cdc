// Test helper contract for MinorityRuleGame
// This contract provides test-only functions that bypass payment requirements

import MinorityRuleGame from "./MinorityRuleGame.cdc"
import FungibleToken from "FungibleToken"
import FlowToken from "FlowToken"

access(all) contract MinorityRuleGameTest {

    // Join a game without payment - for testing only
    access(all) fun joinGameForTest(gameId: UInt64, player: Address) {
        let game = MinorityRuleGame.borrowGame(gameId)
            ?? panic("Game does not exist")

        // Create an empty vault just to satisfy the interface
        let mockVault <- FlowToken.createEmptyVault(vaultType: Type<@FlowToken.Vault>())

        // We can't directly bypass the payment check, so we need a different approach
        destroy mockVault

        // This won't work because we can't access private fields
        // We need to modify the main contract or use a different testing strategy
    }
}