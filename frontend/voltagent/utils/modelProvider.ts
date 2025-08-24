import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createXai } from '@ai-sdk/xai';
import { createGroq } from "@ai-sdk/groq";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

const xai = createXai({
  apiKey: process.env.XAI_API_KEY,
});

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

const hackrx = createOpenAI({
  apiKey: process.env.HACKRX_API_KEY,
  baseURL: process.env.HACKRX_BASE_URL,
});

// Return a dynamic value function that VoltAgent expects
export function getModelForAgent(selectedModel?: string) {
  return () => {
    const model = selectedModel || process.env.SELECTED_MODEL || 'gpt-4o-mini';
    
    switch (model) {
      case 'gpt-4o-mini':
      case 'gpt-4.1-mini':
      case 'gpt-4.1':
        return openai(model);
      case 'gemini-2.5-flash-preview-04-17':
      case 'gemini-2.0-flash':
      case 'gemini-2.5-pro':
        return google(model);
      case 'grok-3-mini':
        return xai(model);
      case 'llama-3.3-70b-versatile':
        return groq(model);
      case 'hackrx-gpt-4o-mini':
        return hackrx('gpt-4o-mini');
      case 'hackrx-gpt-4.1':
        return hackrx('gpt-4.1');
      case 'hackrx-gpt-4.1-mini':
        return hackrx('gpt-4.1-mini');
      case 'hackrx-gpt-5-mini':
        return hackrx('gpt-5-mini');
      default:
        return openai('gpt-4o-mini');
    }
  };
}