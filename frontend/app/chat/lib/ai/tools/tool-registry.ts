import { javaScriptTool } from './javascript-tool';
import { createCodeFileTool } from './create-code-file';

export interface ToolRegistry {
  javaScriptTool: typeof javaScriptTool;
  createCodeFileTool: typeof createCodeFileTool;
}

export function getStaticTools(): ToolRegistry {
  return {
    javaScriptTool: javaScriptTool,
    createCodeFileTool: createCodeFileTool,
  };
}
