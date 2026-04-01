FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV GOOGLE_GEMINI_API_KEY=""
ENV WHATSAPP_GATEWAY_URL=""
ENV NEXT_PUBLIC_SUPABASE_URL=""
ENV SUPABASE_SERVICE_ROLE_KEY=""
ENV BOSS_PHONE="85294740952"
ENV PORT=8000

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
