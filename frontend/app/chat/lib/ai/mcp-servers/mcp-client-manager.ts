import { experimental_createMCPClient } from 'ai';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

export interface MCPServerConfig {
  name: string;
  command?: string;
  args?: string[];
  url?: string;
  transport: 'stdio' | 'http';
  enabled: boolean;
  env?: Record<string, string>;
}

export interface MCPClientManager {
  init(): Promise<void>;
  getClient(serverName?: string): Promise<any>;
  getTools(serverName?: string): Promise<Record<string, any>>;
  getAllTools(): Promise<Record<string, any>>;
  isInitialized(serverName?: string): boolean;
  getAvailableServers(): string[];
  addServerConfig(config: MCPServerConfig): void;
  removeServerConfig(serverName: string): void;
  getServerConfig(serverName: string): MCPServerConfig | undefined;
}

interface ClientState {
  client: any;
  tools: Record<string, any>;
  initialized: boolean;
  initPromise: Promise<void> | null;
}

function createMCPClientManager(): MCPClientManager {
  const clients: Map<string, ClientState> = new Map();
  let globalInitPromise: Promise<void> | null = null;

  const serverConfigs: Record<string, MCPServerConfig> = {
    playwright: {
      name: 'playwright',
      command: 'cmd',
      args: [
        '/c',
        'npx',
        '-y',
        '@smithery/cli@latest',
        'run',
        '@microsoft/playwright-mcp',
        '--key',
        'c7eefd65-fbfe-405c-b071-f54ad4165201'
      ],
      transport: 'stdio',
      enabled: true
    },

    computer: {
      name: 'computer',
      url: 'http://127.0.0.1:8002/mcp',
      transport: 'http',
      enabled: true
    },

    rag: {
      name: 'rag',
      url: 'http://127.0.0.1:8001/mcp',
      transport: 'http',
      enabled: true
    },

    v0: {
      name: 'v0',
      command: "npx",
      args: [
        "mcp-remote",
        "https://mcp.v0.dev",
        "--header",
        "Authorization: Bearer v1:d26X3nJ7mNh9UZPFeeC5Cy0T:FbeW8NZLX8zugE58Bf7TopCJ"
      ],
      transport: 'stdio',
      enabled: true

    }
  
    
    /*
    github: {
      name: 'github',
      command: 'docker',
      args: [
        'run',
        '-i',
        '--rm',
        '-e',
        'GITHUB_PERSONAL_ACCESS_TOKEN',
        'ghcr.io/github/github-mcp-server'
      ],
      transport: 'stdio',
      enabled: !!process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
      env: {
        GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_PERSONAL_ACCESS_TOKEN || ''
      }
    }
    */
    
    // Example of how to add more MCP servers:
    // filesystem: {
    //   name: 'filesystem',
    //   command: 'npx',
    //   args: ['-y', '@modelcontextprotocol/server-filesystem', '/path/to/directory'],
    //   transport: 'stdio',
    //   enabled: false
    // }
  };

  function getClientState(serverName: string): ClientState {
    if (!clients.has(serverName)) {
      clients.set(serverName, {
        client: null,
        tools: {},
        initialized: false,
        initPromise: null
      });
    }
    return clients.get(serverName)!;
  }

  async function initializeClient(serverName: string): Promise<void> {
    const config = serverConfigs[serverName];
    if (!config || !config.enabled) {
      throw new Error(`MCP server '${serverName}' is not configured or disabled`);
    }

    const state = getClientState(serverName);

    try {
      console.log(`Initializing MCP client for ${serverName} using ${config.transport} transport...`);

      let transport;

      if (config.transport === 'http') {
        // HTTP transport for Python MCP server
        if (!config.url) {
          throw new Error(`HTTP MCP server '${serverName}' requires a URL`);
        }
        transport = new StreamableHTTPClientTransport(new URL(config.url));
      } else {
        if (!config.command || !config.args) {
          throw new Error(`Stdio MCP server '${serverName}' requires command and args`);
        }

        const transportOptions: any = {
          command: config.command,
          args: config.args
        };

        if (config.env) {
          transportOptions.env = {
            ...process.env,
            ...config.env
          };
        }

        transport = new StdioClientTransport(transportOptions);
      }

      state.client = await experimental_createMCPClient({
        transport,
      });

      state.tools = await state.client.tools();
      state.initialized = true;
      console.log(`MCP client for ${serverName} (${config.transport}) initialized successfully`);
    } catch (error) {
      console.error(`Failed to initialize MCP client for ${serverName}:`, error);
      state.client = null;
      state.tools = {};
      state.initialized = false;
      throw error;
    }
  }

  return {
    async init(): Promise<void> {
      if (globalInitPromise) {
        return await globalInitPromise;
      }

      const enabledServers = Object.keys(serverConfigs).filter(
        name => serverConfigs[name].enabled
      );

      const allInitialized = enabledServers.every(serverName => {
        const state = clients.get(serverName);
        return state && state.initialized && state.client;
      });

      if (allInitialized) {
        return;
      }

      globalInitPromise = Promise.allSettled(
        enabledServers.map(async (serverName) => {
          const state = getClientState(serverName);

          if (state.initialized && state.client) {
            return;
          }

          if (state.initPromise) {
            return await state.initPromise;
          }

          state.initPromise = initializeClient(serverName);
          try {
            await state.initPromise;
          } finally {
            state.initPromise = null;
          }
        })
      ).then(() => {
        console.log('All MCP servers initialized');
        globalInitPromise = null;
      });

      await globalInitPromise;
    },

    async getClient(serverName: string = 'playwright'): Promise<any> {
      const state = getClientState(serverName);
      
      if (!state.initialized || !state.client) {
        if (state.initPromise) {
          await state.initPromise;
        } else {
          state.initPromise = initializeClient(serverName);
          try {
            await state.initPromise;
          } finally {
            state.initPromise = null;
          }
        }
      }
      
      return state.client;
    },

    async getTools(serverName: string = 'playwright'): Promise<Record<string, any>> {
      const state = getClientState(serverName);
      
      if (!state.initialized || !state.client) {
        await this.getClient(serverName);
      }
      
      return state.tools;
    },

    async getAllTools(): Promise<Record<string, any>> {
      const allTools: Record<string, any> = {};
      
      const enabledServers = Object.keys(serverConfigs).filter(
        name => serverConfigs[name].enabled
      );

      for (const serverName of enabledServers) {
        try {
          const tools = await this.getTools(serverName);
          Object.keys(tools).forEach(toolName => {
            const prefixedName = `${serverName}_${toolName}`;
            allTools[prefixedName] = tools[toolName];
          });
        } catch (error) {
          console.warn(`Failed to get tools from ${serverName}:`, error);
        }
      }
      
      return allTools;
    },

    isInitialized(serverName: string = 'playwright'): boolean {
      const state = clients.get(serverName);
      return state ? state.initialized && state.client !== null : false;
    },

    getAvailableServers(): string[] {
      return Object.keys(serverConfigs).filter(name => serverConfigs[name].enabled);
    },

    addServerConfig(config: MCPServerConfig): void {
      serverConfigs[config.name] = config;
    },

    removeServerConfig(serverName: string): void {
      delete serverConfigs[serverName];
    },

    getServerConfig(serverName: string): MCPServerConfig | undefined {
      return serverConfigs[serverName];
    }
  };
}

declare global {
  // eslint-disable-next-line no-var
  var _mcpClientManager_: MCPClientManager;
}

if (!globalThis._mcpClientManager_) {
  globalThis._mcpClientManager_ = createMCPClientManager();
}

export const initMCPClient = async (serverName?: string) => {
  if (serverName) {
    await globalThis._mcpClientManager_.getClient(serverName);
  } else {
    await globalThis._mcpClientManager_.init();
  }
};

export const mcpClientManager = globalThis._mcpClientManager_;
