import { tool } from 'ai';
import { z } from 'zod';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface JavaScriptExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  executionTime: number;
  filePath?: string;
}

async function executeJavaScriptCode(code: string, filename?: string): Promise<JavaScriptExecutionResult> {
  const startTime = Date.now();
  
  try {
    const executionDir = path.join(process.cwd(), 'hackrx-execution');
    if (!fs.existsSync(executionDir)) {
      fs.mkdirSync(executionDir, { recursive: true });
    }
    
    const fileName = filename || `hackrx_${Date.now()}_${Math.random().toString(36).substring(2, 11)}.js`;
    const filePath = path.join(executionDir, fileName);
    
    fs.writeFileSync(filePath, code, 'utf8');
    
    return new Promise((resolve) => {
      let output = '';
      let error = '';
      
      const nodeProcess = spawn('node', [filePath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 30000, 
        cwd: process.cwd(),
        shell: true
      });
      
      nodeProcess.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      nodeProcess.stderr.on('data', (data) => {
        error += data.toString();
      });
      
      nodeProcess.on('close', (code) => {
        const executionTime = (Date.now() - startTime) / 1000;
        
        if (code === 0) {
          resolve({
            success: true,
            output: output.trim(),
            error: error.trim() || undefined,
            executionTime,
            filePath
          });
        } else {
          resolve({
            success: false,
            output: output.trim(),
            error: error.trim() || `Process exited with code ${code}`,
            executionTime,
            filePath
          });
        }
      });
      
      nodeProcess.on('error', (err) => {
        const executionTime = (Date.now() - startTime) / 1000;
        
        resolve({
          success: false,
          output: output.trim(),
          error: err.message,
          executionTime,
          filePath
        });
      });
      
      setTimeout(() => {
        if (!nodeProcess.killed) {
          nodeProcess.kill();
          const executionTime = (Date.now() - startTime) / 1000;
          
          resolve({
            success: false,
            output: output.trim(),
            error: 'Execution timeout (30 seconds)',
            executionTime,
            filePath
          });
        }
      }, 30000);
    });
    
  } catch (error: any) {
    const executionTime = (Date.now() - startTime) / 1000;
    return {
      success: false,
      error: error.message || 'Failed to execute JavaScript code',
      executionTime
    };
  }
}

export const javaScriptTool = tool({
  description: 'Execute JavaScript code and return the output. The code is executed with Node.js. Use this tool to solve computational problems by writing and running JavaScript code. Always call this tool when you need to generate code to solve a problem.',
  parameters: z.object({
    code: z.string().describe('The JavaScript code to execute. Should be complete and self-contained. Use console.log() to output results.'),
    filename: z.string().optional().describe('Optional filename for the JavaScript file'),
    description: z.string().optional().describe('Description of what the code does'),
  }),
  execute: async ({ code, filename, description }) => {
    try {
      const result = await executeJavaScriptCode(code, filename);

      if (result.success) {
        return {
          success: true,
          output: result.output || '',
          error: result.error || null,
          executionTime: result.executionTime,
          filePath: result.filePath,
          description: description || 'JavaScript code executed successfully'
        };
      } else {
        return {
          success: false,
          output: result.output || '',
          error: result.error || 'Unknown execution error',
          executionTime: result.executionTime,
          filePath: result.filePath,
          description: description || 'JavaScript code execution failed'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        output: '',
        error: error.message || 'Failed to execute JavaScript code',
        executionTime: 0,
        description: description || 'JavaScript code execution error'
      };
    }
  },
});
