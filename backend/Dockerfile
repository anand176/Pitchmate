FROM python:3.12-slim

WORKDIR /app

# build-essential: a few pinned wheels (e.g. sentence-transformers deps) still
# compile native extensions on slim images. curl: used by the compose healthcheck.
# Node.js/npm: required for MCP stdio servers (@drawio/mcp, @figma/mcp via npx).
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        curl \
        ca-certificates \
        gnupg \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
        | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" \
        > /etc/apt/sources.list.d/nodesource.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/* \
    && node --version && npm --version && npx --version

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# --reload-exclude guards against slow/broken reload if the host's local
# backend/venv folder happens to be visible inside the container (it isn't
# part of the image, but may be bind-mounted in by docker-compose for dev).
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000", "--reload", \
     "--reload-exclude", "venv/*", "--reload-exclude", "__pycache__/*"]
