import { z } from 'zod';
import { tool } from 'ai';
import OpenAI from 'openai';
import { InMemoryVectorStore } from './github-to-embedding';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface SearchResult {
  chunkId: string;
  content: string;
  filePath: string;
  score: number;
  metadata: any;
}

interface RagQueryResult {
  success: boolean;
  answer: string;
  sources: SearchResult[];
  confidence: number;
  processingTime: number;
  searchStats: {
    totalChunks: number;
    retrievedChunks: number;
  };
  error?: string;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function generateQueryEmbedding(query: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
      encoding_format: 'float',
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating query embedding:', error);
    throw new Error(`Failed to generate query embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function searchSimilarChunks(
  query: string,
  topK: number = 10,
  minSimilarity: number = 0.3
): Promise<SearchResult[]> {
  const vectorStore = InMemoryVectorStore.getInstance();
  const allChunks = vectorStore.getAllChunks();
  
  if (allChunks.length === 0) {
    throw new Error('No repository data found. Please use the GitHub to Embedding tool first.');
  }

  const queryEmbedding = await generateQueryEmbedding(query);
  
  const similarities: Array<{ chunk: any; score: number }> = [];
  
  for (const chunk of allChunks) {
    if (!chunk.embedding) continue;
    
    const similarity = cosineSimilarity(queryEmbedding, chunk.embedding);
    if (similarity >= minSimilarity) {
      similarities.push({ chunk, score: similarity });
    }
  }
  
  similarities.sort((a, b) => b.score - a.score);
  
  return similarities.slice(0, topK).map(({ chunk, score }) => ({
    chunkId: chunk.id,
    content: chunk.content,
    filePath: chunk.metadata.filePath,
    score,
    metadata: chunk.metadata,
  }));
}

async function generateAnswer(
  query: string,
  context: SearchResult[]
): Promise<{ answer: string; confidence: number }> {
  if (context.length === 0) {
    return {
      answer: "I couldn't find relevant information in the repository to answer your question. Please make sure the repository has been processed using the GitHub to Embedding tool first.",
      confidence: 0
    };
  }

  try {
    const contextText = context.map((result, index) => 
      `[Source ${index + 1}: ${result.filePath}]
${result.content}
`
    ).join('\n');

    const prompt = `Based on the following code repository context, answer the user's question. Be specific and cite file names when relevant.

Repository Context:
${contextText}

User Question: ${query}

Please provide a detailed, accurate answer based on the code and files shown above. If the question is about specific versions, dependencies, or configurations, quote the relevant code snippets. If you can't find a definitive answer in the provided context, say so clearly.

Answer:`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert code analyst. Analyze the provided repository context carefully and answer questions with specific details and file references.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.1,
    });

    const answer = response.choices[0]?.message?.content?.trim() || 
      'Unable to generate answer from the provided context.';

    // Calculate confidence based on context relevance
    const avgScore = context.reduce((sum, result) => sum + result.score, 0) / context.length;
    const confidence = Math.min(avgScore * 100, 95); // Cap at 95%

    return { answer, confidence };

  } catch (error) {
    console.error('Error generating answer:', error);
    return {
      answer: `Error generating answer: ${error instanceof Error ? error.message : 'Unknown error'}`,
      confidence: 0
    };
  }
}

export const ragQueryTool = tool({
  description: 'Query and analyze previously processed GitHub repository contents using RAG (Retrieval Augmented Generation) with vector similarity search',
  parameters: z.object({
    query: z.string().describe('The question or query about the repository codebase'),
    topK: z.number().optional().default(5).describe('Number of similar chunks to retrieve'),
    minSimilarity: z.number().optional().default(0.3).describe('Minimum similarity threshold (0-1)'),
  }),
  execute: async ({ query, topK, minSimilarity }) => {
    const startTime = Date.now();
    
    try {
      const results = await searchSimilarChunks(query, topK, minSimilarity);
      
      if (results.length === 0) {
        return {
          success: false,
          error: 'No relevant content found for the query. The repository might not contain information related to your question.',
          answer: '',
          sources: [],
          confidence: 0,
          processingTime: Date.now() - startTime,
          searchStats: {
            totalChunks: 0,
            retrievedChunks: 0,
          },
        };
      }
      
      const { answer, confidence } = await generateAnswer(query, results);
      
      const vectorStore = InMemoryVectorStore.getInstance();
      const totalChunks = vectorStore.getAllChunks().length;
      
      const result: RagQueryResult = {
        success: true,
        answer: answer,
        sources: results.map(result => ({
          ...result,
          content: result.content.length > 500 ? 
            result.content.substring(0, 500) + '...' : result.content
        })),
        confidence: Math.round(confidence),
        processingTime: Date.now() - startTime,
        searchStats: {
          totalChunks,
          retrievedChunks: results.length,
        },
      };
      
      return result;
      
    } catch (error) {
      console.error('RAG query error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        answer: '',
        sources: [],
        confidence: 0,
        processingTime: Date.now() - startTime,
        searchStats: {
          totalChunks: 0,
          retrievedChunks: 0,
        },
      };
    }
  },
});

export { searchSimilarChunks, generateAnswer, cosineSimilarity };