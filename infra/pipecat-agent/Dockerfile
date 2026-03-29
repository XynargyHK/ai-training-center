FROM python:3.11-slim

WORKDIR /app

# Install system deps for audio processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Runtime env vars (set in Railway)
ENV DAILY_API_KEY=""
ENV DEEPGRAM_API_KEY=""
ENV CEREBRAS_API_KEY=""
ENV CARTESIA_API_KEY=""
ENV CARTESIA_VOICE_ID="a0e99841-438c-4a64-b679-ae501e7d6091"

EXPOSE 8765
CMD ["python", "server.py"]
