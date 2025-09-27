import MinorityRuleGame from "../contracts/MinorityRuleGame.cdc"
import FungibleToken from "FungibleToken"
import FlowToken from "FlowToken"

transaction(
    entryFee: UFix64,
    roundDuration: UFix64,
    questionText: String
) {
    let creator: Address
    let paymentVault: @{FungibleToken.Vault}

    prepare(signer: auth(BorrowValue, SaveValue) &Account) {
        self.creator = signer.address

        // Get the creator's FlowToken vault
        let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(from: /storage/flowTokenVault)
            ?? panic("Could not borrow reference to owner's vault")

        // Withdraw the entry fee for the creator
        self.paymentVault <- vaultRef.withdraw(amount: entryFee)
    }

    execute {
        // Create the game with creator's payment (creator is automatically added as first player)
        let gameId = MinorityRuleGame.createGame(
            creator: self.creator,
            entryFee: entryFee,
            roundDuration: roundDuration,
            questionText: questionText,
            payment: <- self.paymentVault
        )

        log("Created new Minority Rule Game with ID: ".concat(gameId.toString()).concat(" and joined as creator"))
    }
}