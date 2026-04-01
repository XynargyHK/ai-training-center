FROM node:20-slim

RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json .
RUN npm install --omit=dev

COPY . .

ENV PORT=3001
ENV WEBHOOK_URL=""

EXPOSE 3001
CMD ["node", "index.js"]
