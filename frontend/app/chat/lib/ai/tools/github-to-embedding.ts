import { tool } from 'ai';
import { z } from 'zod';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface GitHubRepository {
  owner: string;
  repo: string;
  branch?: string;
  path?: string;
}

interface GitHubFile {
  path: string;
  content: string;
  size: number;
  type: string;
  hash: string;
}

interface EmbeddingChunk {
  id: string;
  content: string;
  metadata: {
    filePath: string;
    chunkIndex: number;
    totalChunks: number;
    repoUrl: string;
    fileSize: number;
    fileType: string;
    fileHash: string;
  };
  embedding: number[];
}

interface GitHubToEmbeddingResult {
  success: boolean;
  repoUrl: string;
  totalFiles: number;
  totalChunks: number;
  chunks: EmbeddingChunk[];
  processingTime: number;
  error?: string;
  stats: {
    fileTypes: Record<string, number>;
    totalSize: number;
    avgChunkSize: number;
  };
}

// In-memory vector store
class InMemoryVectorStore {
  private static instance: InMemoryVectorStore;
  private chunks: Map<string, EmbeddingChunk[]> = new Map();

  static getInstance(): InMemoryVectorStore {
    if (!InMemoryVectorStore.instance) {
      InMemoryVectorStore.instance = new InMemoryVectorStore();
    }
    return InMemoryVectorStore.instance;
  }

  storeChunks(repoUrl: string, chunks: EmbeddingChunk[]): void {
    this.chunks.set(repoUrl, chunks);
    console.log(`Stored ${chunks.length} chunks for repository: ${repoUrl}`);
  }

  getChunks(repoUrl: string): EmbeddingChunk[] {
    return this.chunks.get(repoUrl) || [];
  }

  getAllChunks(): EmbeddingChunk[] {
    const allChunks: EmbeddingChunk[] = [];
    for (const chunks of this.chunks.values()) {
      allChunks.push(...chunks);
    }
    return allChunks;
  }

  clearRepository(repoUrl: string): void {
    this.chunks.delete(repoUrl);
  }

  clear(): void {
    this.chunks.clear();
  }
}

// Parse GitHub URL to extract repository information
function parseGitHubUrl(url: string): GitHubRepository {
  try {
    const urlObj = new URL(url);
    
    if (!urlObj.hostname.includes('github.com')) {
      throw new Error('URL must be a GitHub repository URL');
    }
    
    const pathParts = urlObj.pathname.split('/').filter(part => part);
    
    if (pathParts.length < 2) {
      throw new Error('Invalid GitHub URL format. Expected: https://github.com/owner/repo');
    }
    
    const [owner, repo, ...rest] = pathParts;
    
    let branch = 'main';
    let path = '';
    
    if (rest.length > 0) {
      if (rest[0] === 'tree' && rest.length > 1) {
        branch = rest[1];
        path = rest.slice(2).join('/');
      } else if (rest[0] === 'blob' && rest.length > 2) {
        branch = rest[1];
        path = rest.slice(2).join('/');
      }
    }
    
    return { owner, repo, branch, path };
  } catch (error) {
    throw new Error(`Failed to parse GitHub URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function fetchFileContent(
  repoInfo: GitHubRepository,
  filePath: string
): Promise<string | null> {
  try {
    const { owner, repo, branch = 'main' } = repoInfo;
    const url = `https://uithub.com/${owner}/${repo}/blob/${branch}/${filePath}?accept=application/json`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'GitHub-RAG-Tool/1.0'
      }
    });

    if (!response.ok) {
      console.log(`Failed to fetch content for ${filePath}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (data.content) {
      return typeof data.content === 'string' ? data.content : 
             data.content.text || data.content.content || String(data.content);
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching content for ${filePath}:`, error);
    return null;
  }
}

// Fetch repository contents using uithub API
async function fetchRepositoryContents(
  repoInfo: GitHubRepository,
  options: {
    maxTokens?: number;
    extensions?: string[];
    maxFileSize?: number;
    excludeDirectories?: string[];
  } = {}
): Promise<GitHubFile[]> {
  const { owner, repo, branch = 'main', path = '' } = repoInfo;
  const {
    maxTokens = 50000,
    extensions = [],
    maxFileSize = 100000, 
    excludeDirectories = ['node_modules', '.git', 'dist', 'build', '.next', '__pycache__']
  } = options;

  try {
    const baseUrl = `https://uithub.com/${owner}/${repo}/tree/${branch}`;
    const apiUrl = path ? `${baseUrl}/${path}` : baseUrl;
    const url = `${apiUrl}?accept=application/json`;
    
    console.log(`Fetching repository from: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'GitHub-RAG-Tool/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response format from uithub API');
    }

    console.log('API Response structure:', JSON.stringify(Object.keys(data), null, 2));
    
    if (data.size && data.size.tokens) {
      console.log(`Repository size: ${data.size.tokens} tokens, ${data.size.characters} characters`);
    }

    const files: GitHubFile[] = [];
    let currentTokens = 0;

    const processItem = (item: any, currentPath: string = '') => {
      if (currentTokens >= maxTokens) return;

      const itemName = item.name || item.path || item.filename || 'unknown';
      const itemPath = currentPath ? `${currentPath}/${itemName}` : itemName;
      const itemType = item.type || (item.content ? 'file' : 'directory');
      
      console.log(`Processing item: ${itemPath} (type: ${itemType})`);
      
      if (itemType === 'directory' && excludeDirectories.some(dir => 
        itemPath.includes(dir) || itemName === dir)) {
        console.log(`Skipping excluded directory: ${itemPath}`);
        return;
      }

      if (itemType === 'file' || item.content) {
        if (extensions.length > 0) {
          const ext = itemPath.split('.').pop()?.toLowerCase() || '';
          if (!extensions.includes(ext)) return;
        }

        const itemSize = item.size?.characters || item.size || (item.content ? item.content.length : 0);
        if (itemSize > maxFileSize) {
          console.log(`Skipping large file: ${itemPath} (${itemSize} bytes)`);
          return;
        }

        const textExtensions = [
          'js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'h', 'hpp', 'cs', 'php',
          'rb', 'go', 'rs', 'swift', 'kt', 'scala', 'r', 'dart', 'vue', 'svelte',
          'html', 'htm', 'xml', 'css', 'scss', 'sass', 'less', 'styl',
          'json', 'yaml', 'yml', 'toml', 'ini', 'cfg', 'conf', 'config',
          'md', 'mdx', 'txt', 'rst', 'tex', 'doc', 'docx',
          'sql', 'sh', 'bash', 'ps1', 'bat', 'cmd',
          'dockerfile', 'dockerignore', 'gitignore', 'gitattributes',
          'makefile', 'cmake', 'gradle', 'maven', 'sbt'
        ];

        const fileExt = itemPath.split('.').pop()?.toLowerCase() || '';
        const isTextFile = textExtensions.includes(fileExt) || 
                          itemName?.toLowerCase().includes('makefile') ||
                          itemName?.toLowerCase().includes('dockerfile') ||
                          itemName?.toLowerCase().includes('readme') ||
                          itemName?.toLowerCase().includes('license') ||
                          itemName?.toLowerCase().includes('changelog');

        if (isTextFile && item.content) {
          const content = typeof item.content === 'string' ? item.content : 
                         item.content.text || item.content.content || String(item.content);
          const tokens = Math.ceil(content.length / 4); 
          
          console.log(`Adding file: ${itemPath} (${content.length} chars, ~${tokens} tokens)`);
          
          if (currentTokens + tokens <= maxTokens) {
            files.push({
              path: itemPath,
              content: content,
              size: itemSize,
              type: fileExt || 'unknown',
              hash: item.sha || item.hash || `hash_${Date.now()}_${Math.random()}`
            });
            currentTokens += tokens;
          } else {
            console.log(`Skipping file due to token limit: ${itemPath}`);
          }
        } else {
          console.log(`Skipping non-text file or file without content: ${itemPath}`);
        }
      } else if (itemType === 'directory' && item.children) {
        console.log(`Processing directory: ${itemPath}`);
        Object.values(item.children).forEach((child: any) => {
          processItem(child, itemPath);
        });
      }
    };

    const processTree = async (treeObj: any, currentPath: string = '') => {
      if (!treeObj || typeof treeObj !== 'object') return;
      
      const promises: Promise<void>[] = [];
      
      Object.entries(treeObj).forEach(([name, value]: [string, any]) => {
        if (currentTokens >= maxTokens) return;
        
        const itemPath = currentPath ? `${currentPath}/${name}` : name;
        
        if (value !== null && typeof value === 'object' && excludeDirectories.some(dir => 
          itemPath.includes(dir) || name === dir)) {
          console.log(`Skipping excluded directory: ${itemPath}`);
          return;
        }
        
        if (value === null) {
          console.log(`Found file: ${itemPath}`);
          
          if (extensions.length > 0) {
            const ext = itemPath.split('.').pop()?.toLowerCase() || '';
            if (!extensions.includes(ext)) return;
          }
          
          const textExtensions = [
            'js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'h', 'hpp', 'cs', 'php',
            'rb', 'go', 'rs', 'swift', 'kt', 'scala', 'r', 'dart', 'vue', 'svelte',
            'html', 'htm', 'xml', 'css', 'scss', 'sass', 'less', 'styl',
            'json', 'yaml', 'yml', 'toml', 'ini', 'cfg', 'conf', 'config',
            'md', 'mdx', 'txt', 'rst', 'tex', 'doc', 'docx',
            'sql', 'sh', 'bash', 'ps1', 'bat', 'cmd',
            'dockerfile', 'dockerignore', 'gitignore', 'gitattributes',
            'makefile', 'cmake', 'gradle', 'maven', 'sbt'
          ];
          
          const fileExt = itemPath.split('.').pop()?.toLowerCase() || '';
          const isTextFile = textExtensions.includes(fileExt) || 
                            name?.toLowerCase().includes('makefile') ||
                            name?.toLowerCase().includes('dockerfile') ||
                            name?.toLowerCase().includes('readme') ||
                            name?.toLowerCase().includes('license') ||
                            name?.toLowerCase().includes('changelog');
          
          if (isTextFile) {
            const promise = fetchFileContent(repoInfo, itemPath).then(content => {
              if (content && currentTokens < maxTokens) {
                const tokens = Math.ceil(content.length / 4);
                
                if (content.length <= maxFileSize && currentTokens + tokens <= maxTokens) {
                  console.log(`Adding file: ${itemPath} (${content.length} chars, ~${tokens} tokens)`);
                  files.push({
                    path: itemPath,
                    content: content,
                    size: content.length,
                    type: fileExt || 'unknown',
                    hash: `hash_${Date.now()}_${Math.random()}`
                  });
                  currentTokens += tokens;
                } else {
                  console.log(`Skipping file due to size/token limit: ${itemPath}`);
                }
              }
            });
            promises.push(promise);
          }
        } else if (typeof value === 'object') {
          console.log(`Processing directory: ${itemPath}`);
          const promise = processTree(value, itemPath);
          promises.push(promise);
        }
      });
      
      await Promise.all(promises);
    };

    if (data.tree && typeof data.tree === 'object' && !Array.isArray(data.tree)) {
      console.log('Processing tree object structure...');
      await processTree(data.tree);
      
      console.log(`Tree structure processed. Found ${files.length} files with content.`);
      
    } else if (data.files && Array.isArray(data.files)) {
      console.log(`Processing ${data.files.length} files from files array`);
      data.files.forEach((item: any) => {
        processItem(item);
      });
    } else if (data.tree && Array.isArray(data.tree)) {
      console.log(`Processing ${data.tree.length} items from tree array`);
      data.tree.forEach((item: any) => {
        processItem(item);
      });
    } else if (data.children) {
      Object.values(data.children).forEach((item: any) => {
        processItem(item);
      });
    } else if (Array.isArray(data)) {
      data.forEach((item: any) => {
        processItem(item);
      });
    } else if (data.type === 'file') {
      processItem(data);
    } else if (data.content) {
      console.log('Processing direct content structure...');
      
      if (typeof data.content === 'string') {
        files.push({
          path: data.path || 'unknown',
          content: data.content,
          size: data.size?.characters || data.content.length,
          type: data.path ? data.path.split('.').pop()?.toLowerCase() || 'unknown' : 'unknown',
          hash: data.sha || `hash_${Date.now()}_${Math.random()}`
        });
      } else if (data.content && typeof data.content === 'object') {
        Object.entries(data.content).forEach(([filePath, fileContent]: [string, any]) => {
          if (typeof fileContent === 'string') {
            const fileExt = filePath.split('.').pop()?.toLowerCase() || 'unknown';
            files.push({
              path: filePath,
              content: fileContent,
              size: fileContent.length,
              type: fileExt,
              hash: `hash_${Date.now()}_${Math.random()}`
            });
          }
        });
      }
    } else {
      console.log('Unknown response structure:', Object.keys(data));
      throw new Error(`Unsupported response structure. Available keys: ${Object.keys(data).join(', ')}`);
    }

    console.log(`Found ${files.length} files, estimated ${currentTokens} tokens`);
    return files;

  } catch (error) {
    console.error('Error fetching repository:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      repoInfo,
      url: `https://uithub.com/${repoInfo.owner}/${repoInfo.repo}/tree/${repoInfo.branch || 'main'}`
    });
    throw new Error(`Failed to fetch repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function chunkContent(content: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  if (content.length <= chunkSize) {
    return [content];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < content.length) {
    const end = Math.min(start + chunkSize, content.length);
    const chunk = content.slice(start, end);
    
    if (end < content.length) {
      const lastNewline = chunk.lastIndexOf('\n');
      const lastSentence = chunk.lastIndexOf('.');
      const lastSemicolon = chunk.lastIndexOf(';');
      
      let breakPoint = -1;
      if (lastNewline > chunkSize * 0.8) breakPoint = lastNewline;
      else if (lastSentence > chunkSize * 0.8) breakPoint = lastSentence + 1;
      else if (lastSemicolon > chunkSize * 0.8) breakPoint = lastSemicolon + 1;
      
      if (breakPoint > 0) {
        chunks.push(content.slice(start, start + breakPoint));
        start += breakPoint - overlap;
      } else {
        chunks.push(chunk);
        start += chunkSize - overlap;
      }
    } else {
      chunks.push(chunk);
      break;
    }
  }

  return chunks;
}

async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts,
      encoding_format: 'float',
    });

    return response.data.map(item => item.embedding);
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw new Error(`Failed to generate embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function processFiles(files: GitHubFile[], repoUrl: string): Promise<EmbeddingChunk[]> {
  const allChunks: EmbeddingChunk[] = [];
  const allTexts: string[] = [];
  const chunkMetadata: Array<{
    filePath: string;
    chunkIndex: number;
    totalChunks: number;
    fileSize: number;
    fileType: string;
    fileHash: string;
  }> = [];

  for (const file of files) {
    const chunks = chunkContent(file.content);
    
    for (let i = 0; i < chunks.length; i++) {
      allTexts.push(chunks[i]);
      chunkMetadata.push({
        filePath: file.path,
        chunkIndex: i,
        totalChunks: chunks.length,
        fileSize: file.size,
        fileType: file.type,
        fileHash: file.hash,
      });
    }
  }

  const batchSize = 100;
  const embeddings: number[][] = [];

  for (let i = 0; i < allTexts.length; i += batchSize) {
    const batch = allTexts.slice(i, i + batchSize);
    const batchEmbeddings = await generateEmbeddings(batch);
    embeddings.push(...batchEmbeddings);
    
    if (i + batchSize < allTexts.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  for (let i = 0; i < allTexts.length; i++) {
    const metadata = chunkMetadata[i];
    allChunks.push({
      id: `${repoUrl}_${metadata.filePath}_${metadata.chunkIndex}`,
      content: allTexts[i],
      metadata: {
        ...metadata,
        repoUrl,
      },
      embedding: embeddings[i],
    });
  }

  return allChunks;
}

export const githubToEmbeddingTool = tool({
  description: 'Fetch GitHub repository contents via uithub API and convert them to embeddings using OpenAI text-embedding-3-small for RAG analysis',
  parameters: z.object({
    repoUrl: z.string().describe('GitHub repository URL (e.g., https://github.com/owner/repo)'),
    maxTokens: z.number().optional().default(50000).describe('Maximum tokens to process from the repository'),
    extensions: z.array(z.string()).optional().describe('File extensions to include (empty array means all text files)'),
    maxFileSize: z.number().optional().default(100000).describe('Maximum file size in bytes to process'),
  }),
  execute: async ({ repoUrl, maxTokens, extensions, maxFileSize }) => {
    const startTime = Date.now();
    
    try {
      const repoInfo = parseGitHubUrl(repoUrl);
      
      const files = await fetchRepositoryContents(repoInfo, {
        maxTokens,
        extensions,
        maxFileSize,
      });

      if (files.length === 0) {
        return {
          success: false,
          error: 'No processable files found in the repository',
          repoUrl,
          totalFiles: 0,
          totalChunks: 0,
          chunks: [],
          processingTime: Date.now() - startTime,
          stats: {
            fileTypes: {},
            totalSize: 0,
            avgChunkSize: 0,
          },
        };
      }

      const chunks = await processFiles(files, repoUrl);

      const vectorStore = InMemoryVectorStore.getInstance();
      vectorStore.storeChunks(repoUrl, chunks);

      const fileTypes: Record<string, number> = {};
      let totalSize = 0;

      for (const file of files) {
        fileTypes[file.type] = (fileTypes[file.type] || 0) + 1;
        totalSize += file.size;
      }

      const avgChunkSize = chunks.length > 0 ? 
        chunks.reduce((sum, chunk) => sum + chunk.content.length, 0) / chunks.length : 0;

      const result: GitHubToEmbeddingResult = {
        success: true,
        repoUrl,
        totalFiles: files.length,
        totalChunks: chunks.length,
        chunks: chunks.slice(0, 5), // Return first 5 chunks as sample
        processingTime: Date.now() - startTime,
        stats: {
          fileTypes,
          totalSize,
          avgChunkSize: Math.round(avgChunkSize),
        },
      };

      return result;

    } catch (error) {
      console.error('GitHub to embedding error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        repoUrl,
        totalFiles: 0,
        totalChunks: 0,
        chunks: [],
        processingTime: Date.now() - startTime,
        stats: {
          fileTypes: {},
          totalSize: 0,
          avgChunkSize: 0,
        },
      };
    }
  },
});

export { InMemoryVectorStore };
