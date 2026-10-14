# Official Python 3.12 slim bookworm image
FROM python:3.12-slim-bookworm

# Prevent Python from writing .pyc files and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

# Set work directory
WORKDIR /app

# Install curl for health check (no heavy compiler packages needed since wheels are pre-built)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy and install python dependencies first for layer caching
COPY backend/requirements.txt /app/backend/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r backend/requirements.txt

# Copy application source code
COPY backend /app/backend
COPY frontend /app/frontend

# Set working directory to backend
WORKDIR /app/backend

# Run collectstatic at build time (inline secret key prevents SecretsUsedInArgOrEnv warning)
RUN SECRET_KEY=build-time-secret-key-for-collectstatic python manage.py collectstatic --no-input

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

# Start application using Gunicorn
CMD ["gunicorn", "itint_backend.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "2", "--threads", "4", "--timeout", "60"]
