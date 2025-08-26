# GAS mock server container
FROM node:20-alpine

WORKDIR /app

# Only copy package files first for better caching
COPY package.json ./package.json

RUN npm install --only=production

# Copy the server source
COPY local-server.js ./local-server.js

EXPOSE 8888
CMD ["node", "local-server.js"]
