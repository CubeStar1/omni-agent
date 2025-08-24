import { tool } from 'ai';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';

interface ExecuteCliResult {
  success: boolean;
  filePath?: string;
  cliOutput?: string;
  message?: string;
  error?: string;
}

async function executeCliCommands(
  commands: string[],
  workingDirectory: string
): Promise<{ success: boolean; output?: string; error?: string }> {
  return new Promise((resolve) => {
    const fullCommand = commands.join('; ');
    
    let output = '';
    let error = '';
    
    const cliProcess = spawn('powershell', ['-Command', `cd "${workingDirectory}"; ${fullCommand}`], {
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 30000, 
    });
    
    cliProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    cliProcess.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    cliProcess.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, output });
      } else {
        resolve({ success: false, error: error || `CLI command failed with code ${code}` });
      }
    });
    
    cliProcess.on('error', (err) => {
      resolve({ success: false, error: err.message });
    });
  });
}

async function createFileAndExecuteCli(
  code: string,
  filename: string,
  targetFolder: string,
  cliCommands: string[]
): Promise<ExecuteCliResult> {
  try {
    const rootDir = path.resolve(process.cwd(), '..');
    const fullFolderPath = path.join(rootDir, targetFolder);
    
    if (!fs.existsSync(fullFolderPath)) {
      fs.mkdirSync(fullFolderPath, { recursive: true });
    }
    
    const filePath = path.join(fullFolderPath, filename);
    
    fs.writeFileSync(filePath, code, 'utf8');
    
    if (cliCommands && cliCommands.length > 0) {
      const cliResult = await executeCliCommands(cliCommands, rootDir);
      
      if (cliResult.success) {
        return {
          success: true,
          filePath,
          cliOutput: cliResult.output,
          message: `Code file created at ${filePath} and CLI commands executed successfully.`
        };
      } else {
        return {
          success: true, 
          filePath,
          cliOutput: cliResult.error,
          message: `Code file created at ${filePath}, but CLI commands failed: ${cliResult.error}`
        };
      }
    } else {
      return {
        success: true,
        filePath,
        message: `Code file created at ${filePath}. No CLI commands to execute.`
      };
    }
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

export const createCodeFileTool = tool({
  description: `Create a code file and optionally execute CLI commands from the repository root directory. 
  This tool writes code to a file in the target folder (relative to the root directory) 
  and can execute any CLI commands from the root directory. Useful for git operations, 
  build commands, or any other CLI tasks that need to run from the project root.`,
  parameters: z.object({
    code: z.string().describe('The code content to write to the file'),
    filename: z.string().describe('The name of the file to create (e.g., "solution.js", "answer.py")'),
    targetFolder: z.string().describe('The target folder path where the file should be saved (e.g., "ROUND_6", "solutions")'),
    cliCommands: z.array(z.string()).optional().describe('Optional array of CLI commands to execute from the root directory (e.g., ["git add .", "git commit -m message", "git push"])'),
  }),
  execute: async ({ code, filename, targetFolder, cliCommands = [] }) => {
    const result = await createFileAndExecuteCli(code, filename, targetFolder, cliCommands);
    
    if (result.success) {
      return {
        success: true,
        message: result.message,
        filePath: result.filePath,
        cliOutput: result.cliOutput,
        details: `File operation completed:
- Repository: HackRx-6/ILLVZN
- File: ${targetFolder}/${filename}
- CLI commands executed: ${cliCommands.length > 0 ? cliCommands.join(', ') : 'None'}`
      };
    } else {
      return {
        success: false,
        error: result.error
      };
    }
  }
});
