import * as fcl from "@onflow/fcl";

const isDevMode = process.env.NEXT_PUBLIC_USE_DEV_WALLET === 'true';
const network = process.env.NEXT_PUBLIC_NETWORK || 'emulator';

// Network-specific configurations
const networkConfigs = {
  emulator: {
    accessNode: "http://localhost:8888",
    discoveryWallet: "http://localhost:8701/fcl/authn", // Dev Wallet
  },
  testnet: {
    accessNode: "https://rest-testnet.onflow.org",
    discoveryWallet: "https://fcl-discovery.onflow.org/testnet/authn",
  },
  mainnet: {
    accessNode: "https://rest-mainnet.onflow.org",
    discoveryWallet: "https://fcl-discovery.onflow.org/authn",
  }
};

const currentNetwork = networkConfigs[network as keyof typeof networkConfigs] || networkConfigs.emulator;

const flowConfig = {
  "app.detail.title": process.env.NEXT_PUBLIC_APP_NAME || "Minority Rule Game",
  "app.detail.icon": process.env.NEXT_PUBLIC_APP_ICON || "https://fcl-discovery.onflow.org/images/blocto.png",
  "accessNode.api": process.env.NEXT_PUBLIC_FLOW_ACCESS_NODE || currentNetwork.accessNode,
  "discovery.wallet": process.env.NEXT_PUBLIC_FLOW_WALLET_DISCOVERY || currentNetwork.discoveryWallet,
  "discovery.authn.endpoint": process.env.NEXT_PUBLIC_FLOW_WALLET_DISCOVERY || currentNetwork.discoveryWallet,
  "0xMinorityRuleGame": process.env.NEXT_PUBLIC_MINORITY_RULE_GAME_ADDRESS || "0xf8d6e0586b0a20c7",
  "0xFlowToken": process.env.NEXT_PUBLIC_FLOW_TOKEN_ADDRESS || "0x0ae53cb6e3f42a79",
  "0xFungibleToken": process.env.NEXT_PUBLIC_FUNGIBLE_TOKEN_ADDRESS || "0xee82856bf20e2aa6",
  "0xNonFungibleToken": process.env.NEXT_PUBLIC_NON_FUNGIBLE_TOKEN_ADDRESS || "0xf8d6e0586b0a20c7",
};

export function initializeFCL() {
  fcl.config(flowConfig);

  // Log configuration in development
  if (process.env.NODE_ENV === 'development') {
    console.log('FCL Configuration:', {
      network,
      isDevMode,
      accessNode: flowConfig["accessNode.api"],
      walletDiscovery: flowConfig["discovery.wallet"]
    });
  }
}

export const CONTRACT_ADDR = flowConfig["0xMinorityRuleGame"];
export const FLOW_TOKEN_ADDR = flowConfig["0xFlowToken"];

export default fcl;