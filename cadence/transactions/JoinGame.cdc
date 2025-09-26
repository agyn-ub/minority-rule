import FungibleToken from 0xf233dcee88fe0abe
import FlowToken from 0x1654653399040a61
import MinorityRuleGame from "../contracts/MinorityRuleGame.cdc"

transaction(gameId: UInt64, amount: UFix64) {

    let paymentVault: @FungibleToken.Vault
    let playerAddress: Address

    prepare(signer: AuthAccount) {
        // Get the player's FlowToken vault
        let vaultRef = signer.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
            ?? panic("Could not borrow reference to owner's vault")

        // Withdraw the entry fee
        self.paymentVault <- vaultRef.withdraw(amount: amount)
        self.playerAddress = signer.address
    }

    execute {
        // Get reference to the game
        let game = MinorityRuleGame.borrowGame(gameId)
            ?? panic("Game does not exist")

        // Join the game with payment
        game.joinGame(player: self.playerAddress, payment: <- self.paymentVault)

        log("Player ".concat(self.playerAddress.toString()).concat(" joined game ").concat(gameId.toString()))
    }
}