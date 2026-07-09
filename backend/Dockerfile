FROM python:3.12-slim

WORKDIR /app

# build-essential: a few pinned wheels (e.g. sentence-transformers deps) still
# compile native extensions on slim images. curl: used by the compose healthcheck.
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# --reload-exclude guards against slow/broken reload if the host's local
# backend/venv folder happens to be visible inside the container (it isn't
# part of the image, but may be bind-mounted in by docker-compose for dev).
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000", "--reload", \
     "--reload-exclude", "venv/*", "--reload-exclude", "__pycache__/*"]
