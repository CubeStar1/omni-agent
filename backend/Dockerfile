FROM python:3.12@sha256:35eff340c0acd837b7962f77ee4b8869385dd6fe7d3928375a08f0a3bdd18beb AS pytorch-base

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

# Install uv using the recommended approach
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# Create and activate virtual environment
ENV VIRTUAL_ENV=/opt/venv
RUN uv venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Install NumPy 1.x first to avoid compatibility issues
RUN uv pip install "numpy<2.0" --no-cache

# Install PyTorch CPU-only with specific versions that are known to work
RUN uv pip install torch==2.3.1+cpu torchvision==0.18.1+cpu torchaudio==2.3.1+cpu \
    --index-url https://download.pytorch.org/whl/cpu --no-cache

FROM pytorch-base AS final

# Set work directory
WORKDIR /app

# Install system dependencies (OCR, PDF, OpenCV, etc.)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        curl \
        libmagic1 \
        tesseract-ocr \
        tesseract-ocr-eng \
        libgl1-mesa-glx \
        libglib2.0-0 \
        libsm6 \
        libxext6 \
        libxrender-dev \
        libgomp1 \
        libfontconfig1 \
        poppler-utils \
        wget \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd --create-home --shell /bin/bash app

# Copy requirements.txt first for better caching
COPY requirements.txt .

# Create constraints file for NumPy
RUN echo "numpy<2.0" > constraints.txt

# Install dependencies with NumPy 1.x constraint
RUN uv pip install --no-cache -c constraints.txt -r requirements.txt

# Verify installations
RUN python -c "import torch; import numpy; print(f'PyTorch: {torch.__version__}, NumPy: {numpy.__version__}')"

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p vector_store_cache results \
    && chown -R app:app /app

# Switch to non-root user
USER app

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Command to run the application
CMD ["python", "main.py"]