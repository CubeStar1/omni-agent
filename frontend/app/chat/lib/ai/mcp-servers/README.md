# MCP Client Manager

A centralized manager for handling multiple Model Context Protocol (MCP) servers in the HackRx application.

## Features

- **Centralized Management**: Single interface for managing multiple MCP servers
- **Lazy Initialization**: Servers are initialized only when needed
- **Error Handling**: Graceful handling of server initialization failures
- **Tool Aggregation**: Combines tools from all enabled servers
- **Dynamic Configuration**: Add/remove server configurations at runtime

## Usage

### Basic Usage

```typescript
import { mcpClientManager, initMCPClient } from '@/app/chat/lib/ai/mcp-servers';

// Initialize all enabled servers
await initMCPClient();

// Get all tools from all servers
const allTools = await mcpClientManager.getAllTools();

// Get tools from a specific server
const playwrightTools = await mcpClientManager.getTools('playwright');

// Get a specific client
const playwrightClient = await mcpClientManager.getClient('playwright');
```

### Adding New MCP Servers

```typescript
// Add a new server configuration
mcpClientManager.addServerConfig({
  name: 'github',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-github'],
  enabled: true
});

// Initialize the new server
await initMCPClient('github');

// Get tools from the new server
const githubTools = await mcpClientManager.getTools('github');
```

### Server Management

```typescript
// Check if a server is initialized
const isReady = mcpClientManager.isInitialized('playwright');

// Get available servers
const servers = mcpClientManager.getAvailableServers();

// Reset a specific server
mcpClientManager.reset('playwright');

// Reset all servers
mcpClientManager.resetAll();

// Remove a server configuration
mcpClientManager.removeServerConfig('github');
```

## Default Servers

### Playwright MCP
- **Name**: `playwright`
- **Purpose**: Web automation and browser interaction
- **Tools**: Page navigation, element interaction, content extraction
- **Status**: Enabled by default

## Tool Naming Convention

When using `getAllTools()`, tools from different servers are prefixed with the server name to avoid conflicts:

```typescript
const allTools = await mcpClientManager.getAllTools();
// Results in tools like:
// - playwright_navigate
// - playwright_click
// - github_create_issue
// - github_list_repos
```

## Error Handling

The manager handles errors gracefully:

```typescript
try {
  await initMCPClient();
  const tools = await mcpClientManager.getAllTools();
} catch (error) {
  console.error('Failed to initialize MCP servers:', error);
  // Application continues with available tools
}
```

## Integration with HackRx API

The manager is integrated into the main HackRx API route:

```typescript
// In route.ts
import { mcpClientManager } from '@/app/chat/lib/ai/mcp-servers/mcp-client-manager';

// Initialize and get all tools
await mcpClientManager.init();
const mcpTools = await mcpClientManager.getAllTools();

// Combine with other tools
const tools = {
  ...staticTools,
  ...mcpTools,
};
```

## Architecture

```
MCPClientManager
├── Server Configs (playwright, github, etc.)
├── Client States (per server)
│   ├── client: MCP Client instance
│   ├── tools: Available tools
│   ├── initialized: Status flag
│   └── initPromise: Initialization promise
└── Methods
    ├── init(): Initialize all servers
    ├── getClient(): Get specific client
    ├── getTools(): Get server tools
    ├── getAllTools(): Aggregate all tools
    └── Management methods
```

## Benefits

1. **Scalability**: Easy to add new MCP servers
2. **Reliability**: Isolated error handling per server
3. **Performance**: Lazy loading and singleton pattern
4. **Maintainability**: Centralized configuration and management
5. **Flexibility**: Dynamic server configuration at runtime
