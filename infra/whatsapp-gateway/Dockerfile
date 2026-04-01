FROM node:20-slim

WORKDIR /app

COPY package.json .
RUN npm install --production

COPY . .

ENV PORT=3001
ENV WEBHOOK_URL=""

EXPOSE 3001
CMD ["node", "index.js"]
