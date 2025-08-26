# GAS mock server container
FROM node:20-alpine

WORKDIR /app

# Install dependencies (include dev for nodemon in dev container)
COPY package.json ./package.json
RUN npm install

# Copy the server source
COPY local-server.js ./local-server.js

EXPOSE 8888
CMD ["npm", "run", "dev"]
