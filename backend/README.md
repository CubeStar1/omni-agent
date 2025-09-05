# OmniAgent Backend - Python FastAPI Server (Rounds 1-4)

- Python FastAPI backend with MCP server for document processing and LLM tools
- This was the primary backend for Rounds 1-4. For Rounds 5,6,7, the Next.js API routes are the primary backend.
- The RAG tools are exposed as MCP tools for use in the Next.js backend.

## Overview

This is the Python backend component of the OmniAgent Intelligence System. It provides:
- **FastAPI Server**: High-performance API with automatic documentation
- **MCP Server**: Model Context Protocol server for tool integration using FastMCP
- **Document Processing**: Advanced RAG pipeline with multiple vector store support
- **LLM Integration**: Multiple LLM providers (OpenAI, Google Gemini, Groq, Cerebras)
- **Vector Databases**: Support for Pinecone, Qdrant, and PGVector
- **OCR Processing**: Tesseract OCR and EasyOCR for image text extraction

## Prerequisites

### Option 1: Native Python Setup
- **Python**: 3.12+ (recommended)
- **Git**: For cloning the repository
- **Tesseract OCR**: For image text extraction (optional)

### Option 2: Docker Setup
- **Docker**: Latest version
- **Docker Compose**: For orchestrated deployment

## Quick Start

### Option 1: Native Python Setup (Recommended)

#### 1. Navigate to Backend Directory
```powershell
cd backend
```

#### 2. Create Virtual Environment
```powershell
# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# For Command Prompt (Windows)
# .\venv\Scripts\activate.bat

# For Linux/macOS
# source venv/bin/activate
```

#### 3. Install Dependencies
```powershell
# Install main dependencies
pip install -r requirements.txt

# Install MCP-specific dependencies (optional)
pip install -r requirements-mcp.txt
```

#### 4. Environment Configuration
```powershell
# Copy environment template
cp env.example .env

# Edit .env file with your configuration
notepad .env
```

#### 5. Start Services

**Start FastAPI Server:**
```powershell
python main.py
```
- Server will be available at: `http://127.0.0.1:8000`
- API Documentation: `http://127.0.0.1:8000/docs`
- Health Check: `http://127.0.0.1:8000/health`

**Start MCP Server (Optional - in separate terminal):**
```powershell
# Activate virtual environment first
.\venv\Scripts\Activate.ps1

# Start MCP server
python run_mcp.py
```
- MCP Server will be available at: `http://127.0.0.1:8001`

### Option 2: Docker Setup

#### 1. Navigate to Backend Directory
```powershell
cd backend
```

#### 2. Environment Configuration
```powershell
# Copy environment template
cp .env.example .env

# Edit .env file with your API keys
notepad .env
```

#### 3. Start with Docker Compose
```powershell
# Start services in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### 4. Alternative: PowerShell Script
```powershell
# Use the provided PowerShell script
.\docker-run.ps1
```

**Docker Services:**
- **FastAPI Server**: `http://127.0.0.1:8000`
- **API Documentation**: `http://127.0.0.1:8000/docs`
- **Health Check**: `http://127.0.0.1:8000/health`

## Environment Configuration

### Required Configuration (.env)

Create a `.env` file from `.env.example` and configure the following:

```env
# Environment Configuration
PROJECT_NAME="HackRX Intelligence System"
ENVIRONMENT=production

# Authentication (optional)
BEARER_TOKEN=your-bearer-token

# Vector Store Configuration
DEFAULT_VECTOR_STORE=inmemory
EMBEDDING_MODEL=text-embedding-3-small

# LLM Providers (at least one required)
DEFAULT_LLM_PROVIDER=openai
OPENAI_API_KEY=your-openai-key
GEMINI_API_KEY=your-gemini-key
GROQ_API_KEY=your-groq-key
CEREBRAS_API_KEY=your-cerebras-key

# Vector Database Configuration (optional)
PINECONE_API_KEY=your-pinecone-key
PINECONE_INDEX_NAME=hackrx-documents
PINECONE_ENVIRONMENT=us-east-1

# Processing Configuration
CHUNK_SIZE=1000
CHUNK_OVERLAP=200

# Database (optional)
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-key
SUPABASE_SERVICE_KEY=your-supabase-service-key

# Additional Settings
ENABLE_REQUEST_LOGGING=true
AGENT_ENABLED=true
```


## API Endpoints

### FastAPI Server (Port 8000)

#### Primary Endpoints
- **Health Check**: `GET /health`
- **API Documentation**: `GET /docs`
- **HackRX Evaluation**: `POST /api/hackrx/run`

### MCP Server (Port 8001)

#### Available Tools
- **retrieve_context**: Retrieve relevant context from documents
- **rag_search**: Perform RAG-based search and question answering

## Development Commands

### Python Virtual Environment
```powershell
# Activate environment
.\venv\Scripts\Activate.ps1

# Deactivate environment
deactivate

# Install new dependencies
pip install package-name
pip freeze > requirements.txt
```

### Running Services
```powershell
# Start FastAPI server
python main.py

# Start MCP server
python run_mcp.py

# Run API tests
python test_api.py
```

### Docker Commands
```powershell
# Build and start services
docker-compose up -d --build

# View logs
docker-compose logs -f hackrx-backend

# Stop services
docker-compose down

# Remove containers and volumes
docker-compose down -v

# Rebuild containers
docker-compose build --no-cache
```

## Testing

### API Testing
```powershell
# Run basic API tests
python test_api.py
```


## Project Structure

```
backend/
├── app/                    # FastAPI application
│   ├── api/               # API routes
│   ├── core/              # Core functionality
│   ├── models/            # Data models
│   ├── services/          # Business logic
│   └── main.py           # FastAPI app configuration
├── mcp_server/            # MCP server implementation
│   ├── tools/            # MCP tools
│   ├── config/           # MCP configuration
│   ├── main.py          # MCP server entry point
│   └── server.py        # FastMCP server setup
├── tests/                 # Test files
├── results/              # Test results and outputs
├── schemas/              # Database schemas
├── requirements.txt      # Python dependencies
├── requirements-mcp.txt  # MCP dependencies
├── main.py              # FastAPI server launcher
├── run_mcp.py           # MCP server launcher
├── Dockerfile           # Docker configuration
├── docker-compose.yml   # Docker Compose setup
└── .env.example         # Environment template
```

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

