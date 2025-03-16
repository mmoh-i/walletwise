import { createServer } from "node:http"
import { createMcpServer } from "./mcp-server"
import { walletClusteringTool } from "./src/wallet-clustering"
import { portfolioInsightsTool } from "./src/portfolio-insights"
import { rebalancingAdviceTool } from "./src/rebalancing-advice"
import { executeActionsTool } from "./src/execute-actions"
import { fetchWalletDataTool } from "./src/fetch-wallet-data"
import { config } from "./config"

async function main() {
  // Create HTTP server
  const server = createServer()

  // Create MCP server with tools
  const mcpServer = createMcpServer({
    tools: [
      walletClusteringTool,
      portfolioInsightsTool,
      rebalancingAdviceTool,
      executeActionsTool,
      fetchWalletDataTool,
    ],
    config,
  })

  // Handle HTTP requests
  server.on("request", async (req, res) => {
    try {
      await mcpServer.handleRequest(req, res)
    } catch (error) {
      console.error("Error handling request:", error)
      res.statusCode = 500
      res.end(JSON.stringify({ error: "Internal server error" }))
    }
  })

  // Start server
  const PORT = process.env.PORT || 3000
  server.listen(PORT, () => {
    console.log(`walletwise MCP server running on port ${PORT}`)
  })
}

main().catch(console.error)

