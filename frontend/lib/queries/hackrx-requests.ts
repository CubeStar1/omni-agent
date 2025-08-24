import { createSupabaseBrowser } from '../supabase/client';

// Types for the database schema
export interface HackrxRequest {
  id: string;
  timestamp: string;
  document_url: string;
  questions: unknown;
  answers: unknown;
  processing_time: number;
  document_metadata: unknown;
  raw_response: RawResponse;
  success: boolean;
  error_message: string | null;
  questions_count: number | null;
  chunks_processed: number | null;
  vector_store: string | null;
  created_at: string;
}

export interface RawResponse {
  cache_used: boolean;
  debug_info: DebugInfo[];
  total_questions: number;
  retrieval_method: string;
  chunks_per_question: number;
}

export interface DebugInfo {
  answer: string;
  question: string;
  chunks_count: number;
  context_documents?: string[];
  context_with_scores?: ContextWithScore[];
}

export interface ContextWithScore {
  content: string;
  metadata?: {
    page: number;
    source: string;
    chunk_index: number;
    document_id: string;
    total_chunks: number;
    content_cleaned: boolean;
  };
  similarity_score?: number;
}

// Utility type for better display
export interface RequestSummary {
  id: string;
  timestamp: string;
  document_url: string;
  questions_count: number;
  processing_time: number;
  success: boolean;
  vector_store: string | null;
}

// Query functions
export async function getAllHackrxRequests(): Promise<HackrxRequest[]> {
  const supabase = createSupabaseBrowser();
  
  const { data, error } = await supabase
    .from('hackrx_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching hackrx requests:', error);
    throw error;
  }

  return data || [];
}

export async function getHackrxRequestById(id: string): Promise<HackrxRequest | null> {
  const supabase = createSupabaseBrowser();
  
  const { data, error } = await supabase
    .from('hackrx_requests')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching hackrx request:', error);
    return null;
  }

  return data;
}

export async function getRequestSummaries(): Promise<RequestSummary[]> {
  const supabase = createSupabaseBrowser();
  
  const { data, error } = await supabase
    .from('hackrx_requests')
    .select('id, timestamp, document_url, questions_count, processing_time, success, vector_store')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching request summaries:', error);
    throw error;
  }

  return data || [];
}

export async function getMultipleRequestsById(ids: string[]): Promise<HackrxRequest[]> {
  const supabase = createSupabaseBrowser();
  
  const { data, error } = await supabase
    .from('hackrx_requests')
    .select('*')
    .in('id', ids);

  if (error) {
    console.error('Error fetching multiple requests:', error);
    throw error;
  }

  return data || [];
}
