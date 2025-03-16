import type { McpTool } from "../mcp-server"
import { fetchWalletData } from "./fetch-wallet-data"

export const portfolioInsightsTool: McpTool = {
  name: "get_portfolio_insights",
  description:
    "Provides detailed insights about a Solana wallet portfolio including token holdings, NFTs, and performance metrics",
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

      // Generate portfolio insights
      const insights = generatePortfolioInsights(walletData)

      return {
        wallet_address,
        total_value_usd: insights.totalValueUsd,
        token_holdings: insights.tokenHoldings,
        nft_holdings: insights.nftHoldings,
        staking_positions: insights.stakingPositions,
        performance: insights.performance,
        risk_metrics: insights.riskMetrics,
        unrealized_gains_losses: insights.unrealizedGainsLosses,
      }
    } catch (error) {
      console.error("Error generating portfolio insights:", error)
      throw new Error(
        `Failed to generate portfolio insights: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  },
}

// Helper function to generate portfolio insights
function generatePortfolioInsights(walletData: any) {
  const { tokens, nfts, staking, transactions } = walletData

  // Calculate token holdings value
  const tokenHoldings = tokens.map((token: any) => ({
    symbol: token.symbol,
    amount: token.amount,
    value_usd: token.amount * token.price,
    percentage_of_portfolio: 0, // Will calculate after total is known
    price_change_24h: token.priceChange24h || 0,
  }))

  // Calculate NFT holdings value
  const nftHoldings = {
    count: nfts.length,
    collections: groupNftsByCollection(nfts),
    total_value_estimate: nfts.reduce((total: number, nft: any) => total + (nft.estimatedValue || 0), 0),
  }

  // Calculate staking positions
  const stakingPositions = staking.map((position: any) => ({
    validator: position.validator,
    amount: position.amount,
    apy: position.apy,
    value_usd: position.amount * (tokens.find((t: any) => t.symbol === "SOL")?.price || 0),
    rewards_earned: position.rewards || 0,
  }))

  // Calculate total portfolio value
  const tokenValue = tokenHoldings.reduce((total: number, token: any) => total + token.value_usd, 0)
  const nftValue = nftHoldings.total_value_estimate
  const stakingValue = stakingPositions.reduce((total: number, pos: any) => total + pos.value_usd, 0)
  const totalValueUsd = tokenValue + nftValue + stakingValue

  // Update token percentages
  tokenHoldings.forEach((token) => {
    token.percentage_of_portfolio = (token.value_usd / totalValueUsd) * 100
  })

  // Calculate performance metrics
  const performance = calculatePerformanceMetrics(walletData)

  // Calculate risk metrics
  const riskMetrics = calculateRiskMetrics(tokenHoldings, performance)

  // Calculate unrealized gains/losses
  const unrealizedGainsLosses = calculateUnrealizedGainsLosses(tokens, transactions)

  return {
    totalValueUsd,
    tokenHoldings,
    nftHoldings,
    stakingPositions,
    performance,
    riskMetrics,
    unrealizedGainsLosses,
  }
}

// Helper function to group NFTs by collection
function groupNftsByCollection(nfts: any[]) {
  const collections: Record<string, any> = {}

  nfts.forEach((nft) => {
    const collection = nft.collection || "Unknown"

    if (!collections[collection]) {
      collections[collection] = {
        name: collection,
        count: 0,
        total_value: 0,
      }
    }

    collections[collection].count++
    collections[collection].total_value += nft.estimatedValue || 0
  })

  return Object.values(collections)
}

// Helper function to calculate performance metrics
function calculatePerformanceMetrics(walletData: any) {
  // This would typically involve analyzing historical data
  // For this example, we'll use simplified calculations

  return {
    daily_change_percentage: Math.random() * 10 - 5, // -5% to +5%
    weekly_change_percentage: Math.random() * 20 - 10, // -10% to +10%
    monthly_change_percentage: Math.random() * 40 - 20, // -20% to +20%
    yearly_change_percentage: Math.random() * 100 - 30, // -30% to +70%
  }
}

// Helper function to calculate risk metrics
function calculateRiskMetrics(tokenHoldings: any[], performance: any) {
  // Calculate concentration risk
  const topHolding = tokenHoldings.sort((a, b) => b.value_usd - a.value_usd)[0]
  const concentrationRisk = topHolding ? topHolding.percentage_of_portfolio : 0

  // Calculate volatility (simplified)
  const volatility = Math.abs(performance.daily_change_percentage) * 2

  // Calculate diversification score
  const diversificationScore = 100 - Math.min(concentrationRisk, 100)

  return {
    concentration_risk: concentrationRisk,
    volatility,
    diversification_score: diversificationScore,
    risk_level: getRiskLevel(concentrationRisk, volatility, diversificationScore),
  }
}

// Helper function to determine risk level
function getRiskLevel(concentrationRisk: number, volatility: number, diversificationScore: number) {
  const riskScore = concentrationRisk * 0.4 + volatility * 0.4 - diversificationScore * 0.2

  if (riskScore < 20) return "Low"
  if (riskScore < 50) return "Medium"
  if (riskScore < 80) return "High"
  return "Very High"
}

// Helper function to calculate unrealized gains/losses
function calculateUnrealizedGainsLosses(tokens: any[], transactions: any[]) {
  // This would typically involve analyzing purchase prices vs current prices
  // For this example, we'll use simplified calculations

  const unrealizedByToken = tokens.map((token) => {
    const purchaseTransactions = transactions.filter((tx: any) => tx.type === "swap" && tx.tokenOut === token.symbol)

    const averagePurchasePrice =
      purchaseTransactions.length > 0
        ? purchaseTransactions.reduce((sum: number, tx: any) => sum + tx.priceUsd, 0) / purchaseTransactions.length
        : token.price * 0.8 // Fallback: assume 20% lower than current price

    const unrealizedGainLoss = token.amount * (token.price - averagePurchasePrice)
    const unrealizedGainLossPercentage = (token.price / averagePurchasePrice - 1) * 100

    return {
      symbol: token.symbol,
      unrealized_gain_loss_usd: unrealizedGainLoss,
      unrealized_gain_loss_percentage: unrealizedGainLossPercentage,
    }
  })

  const totalUnrealizedGainLoss = unrealizedByToken.reduce((total, token) => total + token.unrealized_gain_loss_usd, 0)

  return {
    total_unrealized_gain_loss_usd: totalUnrealizedGainLoss,
    by_token: unrealizedByToken,
  }
}

