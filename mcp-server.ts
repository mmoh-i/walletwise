import type { IncomingMessage, ServerResponse } from "node:http"

export interface McpTool {
  name: string
  description: string
  parameters: Record<string, any>
  execute: (params: Record<string, any>) => Promise<any>
}

export interface McpServerConfig {
  openaiApiKey: string
  rpcUrl: string
  solanaPrivateKey: string
}

export interface McpServerOptions {
  tools: McpTool[]
  config: McpServerConfig
}

export function createMcpServer({ tools, config }: McpServerOptions) {
  // MCP protocol version
  const PROTOCOL_VERSION = "0.1"

  // Handle MCP requests
  async function handleRequest(req: IncomingMessage, res: ServerResponse) {
    // Set CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type")

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      res.statusCode = 204
      res.end()
      return
    }

    // Only accept POST requests
    if (req.method !== "POST") {
      res.statusCode = 405
      res.end(JSON.stringify({ error: "Method not allowed" }))
      return
    }

    // Parse request body
    let body = ""
    for await (const chunk of req) {
      body += chunk.toString()
    }

    try {
      const request = JSON.parse(body)

      // Handle different MCP request types
      switch (request.type) {
        case "capabilities":
          handleCapabilitiesRequest(res)
          break

        case "tool_call":
          await handleToolCallRequest(request, res)
          break

        default:
          res.statusCode = 400
          res.end(JSON.stringify({ error: `Unknown request type: ${request.type}` }))
      }
    } catch (error) {
      console.error("Error processing request:", error)
      res.statusCode = 400
      res.end(JSON.stringify({ error: "Invalid request" }))
    }
  }

  // Handle capabilities request
  function handleCapabilitiesRequest(res: ServerResponse) {
    const toolSchemas = tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    }))

    const response = {
      protocol_version: PROTOCOL_VERSION,
      capabilities: {
        tools: toolSchemas,
      },
    }

    res.statusCode = 200
    res.setHeader("Content-Type", "application/json")
    res.end(JSON.stringify(response))
  }

  // Handle tool call request
  async function handleToolCallRequest(request: any, res: ServerResponse) {
    const { tool_name, parameters } = request

    // Find the requested tool
    const tool = tools.find((t) => t.name === tool_name)
    if (!tool) {
      res.statusCode = 404
      res.end(JSON.stringify({ error: `Tool not found: ${tool_name}` }))
      return
    }

    try {
      // Execute the tool with the provided parameters
      const result = await tool.execute(parameters)

      const response = {
        result,
      }

      res.statusCode = 200
      res.setHeader("Content-Type", "application/json")
      res.end(JSON.stringify(response))
    } catch (error) {
      console.error(`Error executing tool ${tool_name}:`, error)
      res.statusCode = 500
      res.end(
        JSON.stringify({
          error: `Error executing tool ${tool_name}: ${error instanceof Error ? error.message : String(error)}`,
        }),
      )
    }
  }

  return {
    handleRequest,
  }
}

