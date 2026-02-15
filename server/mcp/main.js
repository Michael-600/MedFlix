import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { api } from './api.js'
import { createMcpServer } from './createServer.js'
import { registerTools, TOOL_NAMES } from './tools/index.js'

export async function main() {
  const transport = new StdioServerTransport()
  const server = createMcpServer()

  registerTools(server, { api })
  await server.connect(transport)

  console.error('MedFlix MCP server running on stdio')
  console.error(`Tools: ${TOOL_NAMES.join(', ')}`)
}

