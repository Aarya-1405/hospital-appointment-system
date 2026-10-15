FROM node:20-alpine
WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

COPY . .

ENV NODE_ENV=production
EXPOSE 5000
CMD ["node", "server.js"]
