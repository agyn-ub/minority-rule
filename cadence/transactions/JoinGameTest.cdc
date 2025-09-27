import MinorityRuleGame from "../contracts/MinorityRuleGame.cdc"
import FungibleToken from "FungibleToken"
import FlowToken from "FlowToken"

// Test transaction that creates a mock payment for joining the game
transaction(gameId: UInt64, amount: UFix64) {

    prepare(signer: auth(BorrowValue) &Account) {
        // Get reference to the game
        let game = MinorityRuleGame.borrowGame(gameId)
            ?? panic("Game does not exist")

        // Create a mock vault with the required amount for testing
        // In a real environment, this would withdraw from the signer's vault
        let mockVault <- FlowToken.createEmptyVault(vaultType: Type<@FlowToken.Vault>())

        // For testing purposes, we bypass the actual balance requirement
        // The contract will check balance == entryFee, but we can't mint tokens in tests
        // So this will fail, but we can catch it in our test expectations

        // Join the game with mock payment
        game.joinGame(player: signer.address, payment: <- mockVault)
    }
}