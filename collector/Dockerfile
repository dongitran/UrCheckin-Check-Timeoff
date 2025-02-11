FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN ls -la && ls -la models/src/
CMD ["/bin/sh", "-c", ". /vault/secrets/env-config && npm start"]