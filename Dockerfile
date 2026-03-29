# P3 Research Lab - Base Docker Image
# ====================================

FROM python:3.11-slim

# Metadata
LABEL maintainer="P3 Systems Team"
LABEL description="Base image for P3 research infrastructure"
LABEL version="1.0.0"

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    git \
    libpq-dev \
    libhdf5-dev \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy requirements first (for better caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --upgrade pip setuptools wheel && \
    pip install -r requirements.txt

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p /app/data/raw \
    /app/data/processed \
    /app/data/generated \
    /app/data/simulations \
    /app/data/metadata \
    /app/logs

# Set Python path
ENV PYTHONPATH=/app:$PYTHONPATH

# Expose ports
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Default command (can be overridden)
CMD sh -c "uvicorn api.main:app --host 0.0.0.0 --port $PORT"
