import FungibleToken from "FungibleToken"
import FlowToken from "FlowToken"

access(all) fun main(address: Address): UFix64 {
    let account = getAccount(address)

    let vaultRef = account.capabilities.borrow<&{FungibleToken.Balance}>(
        /public/flowTokenBalance
    ) ?? panic("Could not borrow Balance reference to the Vault")

    return vaultRef.balance
}