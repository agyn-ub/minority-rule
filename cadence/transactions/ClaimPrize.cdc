import FungibleToken from 0xf233dcee88fe0abe
import FlowToken from 0x1654653399040a61
import MinorityRuleGame from "../contracts/MinorityRuleGame.cdc"

transaction(gameId: UInt64) {

    let winnerAddress: Address
    let receiverRef: &{FungibleToken.Receiver}

    prepare(signer: AuthAccount) {
        self.winnerAddress = signer.address

        // Get reference to winner's FlowToken receiver
        self.receiverRef = signer.getCapability(/public/flowTokenReceiver)
            .borrow<&{FungibleToken.Receiver}>()
            ?? panic("Could not borrow reference to receiver")
    }

    execute {
        // Get reference to the game
        let game = MinorityRuleGame.borrowGame(gameId)
            ?? panic("Game does not exist")

        // Claim the prize
        let prize <- game.claimPrize(winner: self.winnerAddress)
        let prizeAmount = prize.balance

        // Deposit prize into winner's vault
        self.receiverRef.deposit(from: <- prize)

        log("Winner ".concat(self.winnerAddress.toString())
            .concat(" claimed prize of ")
            .concat(prizeAmount.toString())
            .concat(" FLOW from game ")
            .concat(gameId.toString()))
    }
}