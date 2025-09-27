import * as fcl from "@onflow/fcl";

const flowConfig = {
  "app.detail.title": "Minority Rule Game",
  "app.detail.icon": "https://fcl-discovery.onflow.org/images/blocto.png",
  "accessNode.api": process.env.NEXT_PUBLIC_FLOW_ACCESS_NODE || "http://localhost:8888",
  "discovery.wallet": process.env.NEXT_PUBLIC_FLOW_WALLET_DISCOVERY || "https://fcl-discovery.onflow.org/testnet/authn",
  "0xMinorityRuleGame": process.env.NEXT_PUBLIC_MINORITY_RULE_GAME_ADDRESS || "0xf8d6e0586b0a20c7",
  "0xFlowToken": process.env.NEXT_PUBLIC_FLOW_TOKEN_ADDRESS || "0x0ae53cb6e3f42a79",
  "0xFungibleToken": process.env.NEXT_PUBLIC_FUNGIBLE_TOKEN_ADDRESS || "0xee82856bf20e2aa6",
  "0xNonFungibleToken": process.env.NEXT_PUBLIC_NON_FUNGIBLE_TOKEN_ADDRESS || "0xf8d6e0586b0a20c7",
};

export function initializeFCL() {
  fcl.config(flowConfig);
}

export const CONTRACT_ADDR = flowConfig["0xMinorityRuleGame"];
export const FLOW_TOKEN_ADDR = flowConfig["0xFlowToken"];

export default fcl;