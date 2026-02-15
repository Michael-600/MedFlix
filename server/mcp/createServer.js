import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

export function createMcpServer() {
  return new McpServer({
    name: 'MedFlix Medication Assistant',
    version: '1.0.0',
  })
}

