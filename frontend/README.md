# HackRX API Frontend + Backend (Rounds 5, 6, 7)

This is the comprehensive frontend for the HackRX API, built with Next.js and Tailwind CSS. It features a dashboard for visualizing HackRX API requests, an intelligent chat interface, and VoltAgent integration for enhanced observability.

## Features

### Dashboard
- Real-time visualization of HackRX API requests
- Request/response monitoring and analytics
- Performance metrics and status tracking

### Chat Interface
- AI-powered chat with multiple model support
- Integration with OpenAI, Google Gemini, XAI Grok, Groq, and HackRX models
- Real-time streaming responses
- Tool integration for enhanced capabilities

### VoltAgent Integration
- Advanced observability and monitoring
- Agent-based architecture for better performance tracking
- Tool execution monitoring and debugging
- Multi-agent coordination capabilities

###  API Endpoints
- **HackRX Evaluation**: `/api/hackrx/run` - Main backend API for Rounds 5, 6, 7
- **Chat**: `/api/chat` - Chat interface API 

## Tech Stack

- [Next.js 14](https://nextjs.org/) 
- [Supabase](https://supabase.com/) 
- [Shadcn UI](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/) 
- [TypeScript](https://www.typescriptlang.org/)
- [VoltAgent](https://voltagent.ai/)
- [Vercel AI SDK](https://sdk.vercel.ai/)
- [Recharts](https://recharts.org/)

## Getting Started

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

3. Create a Supabase project and get your credentials
4. Set up your environment variables by copying `env.example` to `.env.local` and fill in the required values:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Models
OPENAI_API_KEY=your_openai_api_key
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_key
XAI_API_KEY=your_xai_api_key
GROQ_API_KEY=your_groq_api_key

# HackRX API
HACKRX_API_KEY=your_hackrx_api_key
HACKRX_BASE_URL=your_hackrx_base_url

# Model Selection
SELECTED_MODEL=gpt-4o-mini
```

5. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

The project follows the Next.js 14 App Router structure:

```
frontend/
├── app/                    # App Router pages and API routes
│   ├── api/               # API endpoints for rounds 5, 6, 7
│   ├── chat/              # Chat interface components
│   ├── dashboard/         # Dashboard for API monitoring
│   └── hackrx-execution/  # HackRX challenge execution
├── components/            # Reusable UI components
│   ├── ui/               # Shadcn UI components
│   └── dashboard/        # Dashboard-specific components
├── lib/                   # Utility functions and configurations
│   └── ai/               # AI model providers and tools
├── voltagent/            # VoltAgent integration
│   ├── tools/            # VoltAgent tools
│   └── utils/            # VoltAgent utilities
├── hooks/                # Custom React hooks
├── types/                # TypeScript type definitions
└── public/               # Static assets
```

## Key Components

### Dashboard (`/dashboard`)
- **Request Monitor**: Real-time tracking of API requests
- **Analytics**: Performance metrics and usage statistics
- **Logs**: Detailed request/response logging
- **Health Status**: System health and uptime monitoring

### Chat Interface (`/chat`)
- **Multi-Model Support**: Switch between different AI providers
- **Tool Integration**: JavaScript execution, file creation, and MCP tools
- **Streaming**: Real-time response streaming
- **History**: Conversation persistence

### API Routes (`/api`)
- **HackRX Evaluation**: `/api/hackrx/run` - Main backend API for Rounds 5, 6, 7
- **Chat**: `/api/chat` - Chat interface API

### VoltAgent Integration
- **Observability**: Real-time monitoring of AI agent activities
- **Tool Execution**: MCP (Model Context Protocol) tools integration
- **Multi-Agent**: Coordination between different AI agents
- **Debugging**: Comprehensive logging and error tracking


