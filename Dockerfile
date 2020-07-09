FROM node:12.18.2-alpine3.12

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

CMD ["node", "/app/index.js"]
