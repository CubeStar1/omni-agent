import { createSupabaseServer } from '@/lib/supabase/server';

export interface ToolCall {
  toolName: string;
  input: any;
  output: any;
  timestamp: string;
  executionTime?: number;
}

export interface HackRxLogEntry {
  url?: string;
  query?: string;
  questions: string[];
  answers: string[];
  processingTime: number;
  success: boolean;
  errorMessage?: string;
  rawResponse?: any;
  toolCalls?: ToolCall[];
}

export async function logHackRxRequest(logEntry: HackRxLogEntry): Promise<void> {
  try {
    const supabase = await createSupabaseServer();

    const dbLogEntry = {
      timestamp: new Date().toISOString(),
      document_url: logEntry.url || logEntry.query || 'hackrx-challenge',
      questions: logEntry.questions,
      answers: logEntry.answers,
      processing_time: logEntry.processingTime,
      document_metadata: {
        url: logEntry.url,
        query: logEntry.query,
        timestamp: new Date().toISOString(),
        tool_type: 'hackrx_unified'
      },
      raw_response: {
        ...logEntry.rawResponse || {},
        toolCalls: logEntry.toolCalls || []
      },
      success: logEntry.success,
      error_message: logEntry.errorMessage,
      questions_count: logEntry.questions.length,
      chunks_processed: 0,
      vector_store: 'hackrx_unified'
    };

    const { error } = await supabase
      .from('hackrx_requests')
      .insert(dbLogEntry);

    if (error) {
      console.error('Error logging to Supabase:', error);
    } else {
      console.log('Successfully logged request to Supabase');
    }
  } catch (error) {
    console.error('Failed to log to Supabase:', error);
  }
}
