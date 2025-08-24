import { mcpClientManager } from '@/app/chat/lib/ai/mcp-servers/mcp-client-manager';

export async function getMCPTools() {
  try {
    await mcpClientManager.init();
    const allTools = await mcpClientManager.getAllTools();
    return allTools;
  } catch (error) {
    console.warn("Failed to get MCP tools:", error);
    return {};
  }
}

export async function getMCPToolsFromServer(serverName: string) {
  try {
    await mcpClientManager.init();
    const tools = await mcpClientManager.getTools(serverName);
    return tools;
  } catch (error) {
    console.warn(`Failed to get MCP tools from server ${serverName}:`, error);
    return {};
  }
}