FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++ 

COPY package*.json ./
RUN npm install

COPY . .

ENV NODE_ENV=production

CMD ["/bin/sh", "-c", ". /vault/secrets/env-config && node src/index.js"]