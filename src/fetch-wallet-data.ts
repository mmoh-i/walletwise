import type { McpTool } from "../mcp-server"

// Mock data for development purposes
const MOCK_DATA = {
  tokens: [
    { symbol: "SOL", amount: 25.5, price: 150.75, priceChange24h: 2.5 },
    { symbol: "USDC", amount: 1250, price: 1, priceChange24h: 0 },
    { symbol: "RAY", amount: 100, price: 0.75, priceChange24h: -1.2 },
    { symbol: "BONK", amount: 1000000, price: 0.00002, priceChange24h: 5.7 },
  ],
  nfts: [
    { name: "DeGod #1234", collection: "DeGods", estimatedValue: 150 },
    { name: "Okay Bear #567", collection: "Okay Bears", estimatedValue: 80 },
    { name: "Solana Monkey #789", collection: "SMB", estimatedValue: 65 },
  ],
  staking: [
    { validator: "Lido", amount: 10, apy: 6.2, rewards: 0.15 },
    { validator: "Marinade", amount: 5, apy: 6.5, rewards: 0.08 },
  ],
  transactions: [
    {
      type: "swap",
      tokenIn: "SOL",
      tokenOut: "USDC",
      amount: 2,
      priceUsd: 145.5,
      timestamp: "2023-05-15T10:30:00Z",
      program: "jupiter",
    },
    {
      type: "swap",
      tokenIn: "USDC",
      tokenOut: "RAY",
      amount: 100,
      priceUsd: 0.8,
      timestamp: "2023-05-10T14:20:00Z",
      program: "raydium",
    },
    { type: "stake", token: "SOL", amount: 5, timestamp: "2023-04-20T09:15:00Z", program: "marinade" },
    { type: "nft_purchase", nft: "DeGod #1234", price: 140, timestamp: "2023-03-05T16:45:00Z", program: "magiceden" },
  ],
}

export const fetchWalletDataTool: McpTool = {
  name: "fetch_wallet_data",
  description:
    "Fetches comprehensive data about a Solana wallet including tokens, NFTs, staking positions, and transaction history",
  parameters: {
    type: "object",
    properties: {
      wallet_address: {
        type: "string",
        description: "The Solana wallet address to fetch data for",
      },
    },
    required: ["wallet_address"],
  },

  execute: async ({ wallet_address }) => {
    try {
      // In a real implementation, this would fetch actual on-chain data
      // For this example, we'll return mock data
      const walletData = await fetchWalletData(wallet_address)

      return walletData
    } catch (error) {
      console.error("Error fetching wallet data:", error)
      throw new Error(`Failed to fetch wallet data: ${error instanceof Error ? error.message : String(error)}`)
    }
  },
}

// Helper function to fetch wallet data
export async function fetchWalletData(walletAddress: string) {
  // Validate wallet address
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(walletAddress)) {
    throw new Error("Invalid Solana wallet address")
  }

  // In a real implementation, this would use the Solana web3.js library
  // to fetch on-chain data for the wallet
  console.log(`Fetching data for wallet: ${walletAddress}`)

  // For this example, we'll return mock data
  // In a real implementation, you would:
  // 1. Fetch token balances using getTokenAccountsByOwner
  // 2. Fetch NFTs using Metaplex
  // 3. Fetch staking positions from stake accounts
  // 4. Fetch transaction history

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Return mock data
  return {
    ...MOCK_DATA,
    wallet_address: walletAddress,
  }
}

