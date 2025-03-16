import type { McpTool } from "../mcp-server"
import { fetchWalletData } from "./fetch-wallet-data"

// Define wallet clusters
const WALLET_CLUSTERS = {
  NFT_WHALE: "NFT Whale",
  DEFI_FARMER: "DeFi Farmer",
  HODLER: "Hodler",
  TRADER: "Trader",
  STAKER: "Staker",
  DIVERSIFIED: "Diversified",
}

export const walletClusteringTool: McpTool = {
  name: "cluster_wallet",
  description: "Analyzes a Solana wallet and categorizes it into a specific cluster based on its holdings and behavior",
  parameters: {
    type: "object",
    properties: {
      wallet_address: {
        type: "string",
        description: "The Solana wallet address to analyze",
      },
    },
    required: ["wallet_address"],
  },

  execute: async ({ wallet_address }) => {
    try {
      // Fetch wallet data
      const walletData = await fetchWalletData(wallet_address)

      // Analyze wallet data to determine cluster
      const cluster = determineWalletCluster(walletData)

      // Return the cluster information
      return {
        wallet_address,
        cluster: cluster.type,
        cluster_description: cluster.description,
        confidence_score: cluster.confidence,
        traits: cluster.traits,
      }
    } catch (error) {
      console.error("Error clustering wallet:", error)
      throw new Error(`Failed to cluster wallet: ${error instanceof Error ? error.message : String(error)}`)
    }
  },
}

// Helper function to determine wallet cluster
function determineWalletCluster(walletData: any) {
  // Extract relevant data
  const { tokens, nfts, transactions, staking } = walletData

  // Calculate metrics for clustering
  const nftValue = calculateNftValue(nfts)
  const defiActivity = calculateDefiActivity(transactions)
  const stakingAmount = calculateStakingAmount(staking)
  const tradingFrequency = calculateTradingFrequency(transactions)
  const tokenDiversity = calculateTokenDiversity(tokens)

  // Determine primary and secondary traits
  const traits = []

  if (nftValue > 100) traits.push("High NFT holdings")
  if (defiActivity > 50) traits.push("Active in DeFi protocols")
  if (stakingAmount > 100) traits.push("Significant staking positions")
  if (tradingFrequency > 20) traits.push("Frequent trader")
  if (tokenDiversity > 10) traits.push("Diversified portfolio")

  // Determine cluster based on dominant traits
  let clusterType = WALLET_CLUSTERS.DIVERSIFIED
  let confidence = 0.6
  let description = "A wallet with a balanced and diverse portfolio of assets"

  if (nftValue > 500 && nftValue > defiActivity && nftValue > stakingAmount) {
    clusterType = WALLET_CLUSTERS.NFT_WHALE
    confidence = 0.8
    description = "A wallet primarily focused on collecting and trading NFTs"
  } else if (defiActivity > 100 && defiActivity > nftValue && defiActivity > stakingAmount) {
    clusterType = WALLET_CLUSTERS.DEFI_FARMER
    confidence = 0.85
    description = "A wallet actively participating in DeFi protocols for yield farming"
  } else if (stakingAmount > 200 && stakingAmount > nftValue && stakingAmount > defiActivity) {
    clusterType = WALLET_CLUSTERS.STAKER
    confidence = 0.9
    description = "A wallet primarily focused on staking for passive income"
  } else if (tradingFrequency > 50 && tradingFrequency > stakingAmount) {
    clusterType = WALLET_CLUSTERS.TRADER
    confidence = 0.75
    description = "A wallet frequently trading tokens and actively managing positions"
  } else if (tokenDiversity < 5 && tradingFrequency < 10) {
    clusterType = WALLET_CLUSTERS.HODLER
    confidence = 0.7
    description = "A wallet holding a small number of tokens for the long term"
  }

  return {
    type: clusterType,
    description,
    confidence,
    traits,
  }
}

// Helper functions for metrics calculation
function calculateNftValue(nfts: any[]): number {
  return nfts.reduce((total, nft) => total + (nft.estimatedValue || 0), 0)
}

function calculateDefiActivity(transactions: any[]): number {
  return transactions.filter(
    (tx) => tx.program === "saber" || tx.program === "raydium" || tx.program === "marinade" || tx.program === "solend",
  ).length
}

function calculateStakingAmount(staking: any[]): number {
  return staking.reduce((total, stake) => total + (stake.amount || 0), 0)
}

function calculateTradingFrequency(transactions: any[]): number {
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  return transactions.filter((tx) => tx.type === "swap" && new Date(tx.timestamp).getTime() > oneWeekAgo).length
}

function calculateTokenDiversity(tokens: any[]): number {
  return tokens.length
}

