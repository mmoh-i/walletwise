import type { McpTool } from "../mcp-server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { fetchWalletData } from "./fetch-wallet-data"

export const rebalancingAdviceTool: McpTool = {
  name: "get_rebalancing_advice",
  description:
    "Generates AI-driven portfolio rebalancing advice for a Solana wallet based on its holdings and market conditions",
  parameters: {
    type: "object",
    properties: {
      wallet_address: {
        type: "string",
        description: "The Solana wallet address to analyze",
      },
      risk_preference: {
        type: "string",
        enum: ["conservative", "moderate", "aggressive"],
        description: "The user's risk preference for portfolio rebalancing",
      },
    },
    required: ["wallet_address", "risk_preference"],
  },

  execute: async ({ wallet_address, risk_preference }) => {
    try {
      // Fetch wallet data
      const walletData = await fetchWalletData(wallet_address)

      // Generate portfolio insights
      const insights = await generatePortfolioInsights(walletData)

      // Generate rebalancing advice using AI
      const advice = await generateRebalancingAdvice(insights, risk_preference)

      return {
        wallet_address,
        risk_preference,
        current_allocation: insights.currentAllocation,
        target_allocation: advice.targetAllocation,
        rebalancing_actions: advice.actions,
        reasoning: advice.reasoning,
        estimated_impact: advice.estimatedImpact,
      }
    } catch (error) {
      console.error("Error generating rebalancing advice:", error)
      throw new Error(
        `Failed to generate rebalancing advice: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  },
}

// Helper function to generate portfolio insights
async function generatePortfolioInsights(walletData: any) {
  const { tokens, nfts, staking } = walletData

  // Calculate current allocation percentages
  const tokenValue = tokens.reduce((total: number, token: any) => total + token.amount * token.price, 0)
  const nftValue = nfts.reduce((total: number, nft: any) => total + (nft.estimatedValue || 0), 0)
  const stakingValue = staking.reduce(
    (total: number, pos: any) => total + pos.amount * (tokens.find((t: any) => t.symbol === "SOL")?.price || 0),
    0,
  )

  const totalValue = tokenValue + nftValue + stakingValue

  const currentAllocation = {
    tokens: (tokenValue / totalValue) * 100,
    nfts: (nftValue / totalValue) * 100,
    staking: (stakingValue / totalValue) * 100,
  }

  // Token breakdown
  const tokenBreakdown = tokens.map((token: any) => ({
    symbol: token.symbol,
    percentage: ((token.amount * token.price) / totalValue) * 100,
  }))

  return {
    totalValue,
    currentAllocation,
    tokenBreakdown,
    riskLevel: calculateRiskLevel(currentAllocation, tokenBreakdown),
  }
}

// Helper function to calculate risk level
function calculateRiskLevel(allocation: any, tokenBreakdown: any[]) {
  // Higher NFT percentage = higher risk
  // Lower staking percentage = higher risk
  // High concentration in single token = higher risk

  const nftRiskFactor = allocation.nfts * 0.5
  const stakingRiskFactor = (100 - allocation.staking) * 0.3

  // Calculate concentration risk
  let concentrationRisk = 0
  if (tokenBreakdown.length > 0) {
    const maxConcentration = Math.max(...tokenBreakdown.map((t) => t.percentage))
    concentrationRisk = maxConcentration * 0.2
  }

  const totalRiskScore = nftRiskFactor + stakingRiskFactor + concentrationRisk

  if (totalRiskScore < 30) return "Low"
  if (totalRiskScore < 60) return "Medium"
  if (totalRiskScore < 80) return "High"
  return "Very High"
}

// Helper function to generate rebalancing advice using AI
async function generateRebalancingAdvice(insights: any, riskPreference: string) {
  // Prepare the prompt for the AI
  const prompt = `
    You are an expert crypto portfolio advisor specializing in Solana. 
    
    Current portfolio information:
    - Total value: $${insights.totalValue.toFixed(2)}
    - Current allocation: ${JSON.stringify(insights.currentAllocation)}
    - Token breakdown: ${JSON.stringify(insights.tokenBreakdown)}
    - Current risk level: ${insights.riskLevel}
    - User's risk preference: ${riskPreference}
    
    Based on this information, provide rebalancing advice to optimize the portfolio according to the user's risk preference.
    Include specific actions the user should take (e.g., "Stake 50 SOL for 6% APY", "Sell 2 low-value NFTs", "Swap 10% of SOL for USDC").
    
    Format your response as JSON with the following structure:
    {
      "targetAllocation": { "tokens": number, "nfts": number, "staking": number },
      "actions": [{ "action": string, "description": string, "impact": string }],
      "reasoning": string,
      "estimatedImpact": { "risk": string, "potentialReturn": string }
    }
  `

  try {
    // Generate advice using AI
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      system:
        "You are an AI financial advisor specializing in crypto portfolio optimization. Provide clear, actionable advice based on the data provided.",
    })

    // Parse the AI response
    const advice = JSON.parse(text)

    return advice
  } catch (error) {
    console.error("Error generating AI advice:", error)

    // Fallback to rule-based advice if AI fails
    return generateFallbackAdvice(insights, riskPreference)
  }
}

// Helper function to generate fallback advice based on rules
function generateFallbackAdvice(insights: any, riskPreference: string) {
  const { currentAllocation, tokenBreakdown } = insights

  // Define target allocations based on risk preference
  let targetAllocation = { tokens: 0, nfts: 0, staking: 0 }

  switch (riskPreference) {
    case "conservative":
      targetAllocation = { tokens: 40, nfts: 10, staking: 50 }
      break
    case "moderate":
      targetAllocation = { tokens: 50, nfts: 20, staking: 30 }
      break
    case "aggressive":
      targetAllocation = { tokens: 60, nfts: 30, staking: 10 }
      break
  }

  // Generate actions based on differences between current and target allocations
  const actions = []

  if (currentAllocation.staking < targetAllocation.staking) {
    actions.push({
      action: "Increase staking",
      description: `Stake more SOL to reach ${targetAllocation.staking.toFixed(0)}% of your portfolio`,
      impact: "Increases stability and provides passive income",
    })
  }

  if (currentAllocation.nfts > targetAllocation.nfts) {
    actions.push({
      action: "Reduce NFT exposure",
      description: `Sell some low-value NFTs to reduce NFT allocation to ${targetAllocation.nfts.toFixed(0)}%`,
      impact: "Reduces volatility and increases liquidity",
    })
  }

  // Check for token diversification
  if (tokenBreakdown.length > 0) {
    const highestConcentration = tokenBreakdown.sort((a: any, b: any) => b.percentage - a.percentage)[0]

    if (highestConcentration.percentage > 40) {
      actions.push({
        action: "Diversify tokens",
        description: `Reduce ${highestConcentration.symbol} position by swapping some for other tokens`,
        impact: "Reduces concentration risk and improves diversification",
      })
    }
  }

  return {
    targetAllocation,
    actions,
    reasoning: `Based on your ${riskPreference} risk preference, we recommend adjusting your portfolio to achieve better balance between growth potential and stability.`,
    estimatedImpact: {
      risk: riskPreference === "conservative" ? "Lower" : riskPreference === "aggressive" ? "Higher" : "Balanced",
      potentialReturn:
        riskPreference === "conservative" ? "Moderate" : riskPreference === "aggressive" ? "High" : "Balanced",
    },
  }
}

