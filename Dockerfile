FROM node:20-slim AS base

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source
COPY . .

# NEXT_PUBLIC_ vars baked in at build time (passed from Railway)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

# Server-side vars: dummy values at build time so module-level Supabase init doesn't throw.
# Real values are injected by Railway at runtime (process.env is re-read on server start).
ARG SUPABASE_SERVICE_ROLE_KEY=build_placeholder
ARG GOOGLE_GEMINI_API_KEY=build_placeholder
ENV SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
ENV GOOGLE_GEMINI_API_KEY=$GOOGLE_GEMINI_API_KEY

# Build Next.js app
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Runtime
EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production

CMD ["npm", "run", "start"]
