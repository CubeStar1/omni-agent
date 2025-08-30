import { VoltAgent, Agent } from "@voltagent/core";
import { VercelAIProvider } from "@voltagent/vercel-ai";
import { getModelForAgent } from './utils/modelProvider';
import { getMCPTools } from "./tools/mcpTools";
import { getGeneralAgentPrompt } from '@/app/chat/lib/ai/prompts/general-agent';
import { createTool } from "@voltagent/core";
import { z } from "zod";
import { javaScriptTool } from '@/app/chat/lib/ai/tools/javascript-tool';
import { createCodeFileTool } from '@/app/chat/lib/ai/tools/create-code-file';
import { tavilySearchTool } from "./tools/customTools";

function convertAIToolToVoltAgent(name: string, aiTool: any) {
  return createTool({
    name,
    description: aiTool.description || `Tool: ${name}`,
    parameters: aiTool.parameters,
    execute: async (args) => {
      try {
        const result = await aiTool.execute(args);
        return typeof result === 'string' ? result : JSON.stringify(result);
      } catch (error: any) {
        console.error(`Error executing tool ${name}:`, error);
        return JSON.stringify({ error: `Tool ${name} failed: ${error?.message || 'Unknown error'}` });
      }
    }
  });
}

async function getAllTools() {
  const tools: any[] = [];
  
  // tools.push(convertAIToolToVoltAgent('javaScriptTool', javaScriptTool));
  // tools.push(convertAIToolToVoltAgent('createCodeFileTool', createCodeFileTool));
  tools.push(convertAIToolToVoltAgent('tavilySearch', tavilySearchTool));

  try {
    const mcpTools = await getMCPTools();
    Object.entries(mcpTools).forEach(([name, tool]) => {
      if (tool && typeof tool === 'object' && tool.parameters && tool.execute) {
        tools.push(convertAIToolToVoltAgent(name, tool));
      }
    });
  } catch (error) {
    console.warn('MCP tools not available:', error);
  }
  
  return tools;
}

const agent = new Agent({
  name: "HackRXAgent",
  instructions: getGeneralAgentPrompt(),
  llm: new VercelAIProvider(),
  model: getModelForAgent(), 
  tools: await getAllTools(),
  maxSteps: 20
});

export { agent };

new VoltAgent({
  agents: {
    agent: agent,
  },
});