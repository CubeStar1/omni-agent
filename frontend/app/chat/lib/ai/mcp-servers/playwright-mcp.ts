import { mcpClientManager } from './mcp-client-manager';

export class PlaywrightMCP {
  private serverName = 'playwright';

  async initialize(): Promise<void> {
    await mcpClientManager.getClient(this.serverName);
  }

  async getTools(): Promise<Record<string, any>> {
    return await mcpClientManager.getTools(this.serverName);
  }

  isInitialized(): boolean {
    return mcpClientManager.isInitialized(this.serverName);
  }
}

// Singleton instance
let playwrightMCPInstance: PlaywrightMCP | null = null;

export function getPlaywrightMCP(): PlaywrightMCP {
  if (!playwrightMCPInstance) {
    playwrightMCPInstance = new PlaywrightMCP();
  }
  return playwrightMCPInstance;
}
