# Flow Testnet Deployment Guide

## Generated Testnet Keys

**IMPORTANT: Store these securely and never commit to version control!**

- **Public Key:** `665b9a842b625956e2bd96b48cdc60d94acfad001f492db3d1f8c94be11273f6b2e9e81922c4e96b598cfb55326e6b0648ea1aafc59aee0b8577ddfa5136dbee`
- **Private Key:** Stored in `testnet-account.pkey` (DO NOT COMMIT)
- **Signature Algorithm:** ECDSA_P256

## Next Steps

### 1. Create Testnet Account

Visit the Flow Testnet Faucet to create and fund your account:
https://testnet-faucet.onflow.org/?key=665b9a842b625956e2bd96b48cdc60d94acfad001f492db3d1f8c94be11273f6b2e9e81922c4e96b598cfb55326e6b0648ea1aafc59aee0b8577ddfa5136dbee

1. Click the link above
2. Complete the captcha
3. Click "Create Account"
4. Save the account address provided

### 2. Update flow.json

After getting your testnet account address, update the flow.json file with the testnet configuration.

### 3. Deploy Contract

Run: `flow project deploy --network testnet`

### 4. Update Frontend Configuration

Create `.env.testnet` file with:
```
NEXT_PUBLIC_FLOW_NETWORK=testnet
NEXT_PUBLIC_FLOW_ACCESS_NODE=https://rest-testnet.onflow.org
NEXT_PUBLIC_FLOW_WALLET_DISCOVERY=https://fcl-discovery.onflow.org/testnet/authn
NEXT_PUBLIC_MINORITY_RULE_GAME_ADDRESS=<deployed_contract_address>
```

## Important URLs

- **Testnet Access Node:** https://rest-testnet.onflow.org
- **Testnet Faucet:** https://testnet-faucet.onflow.org
- **Testnet Explorer:** https://testnet.flowdiver.io