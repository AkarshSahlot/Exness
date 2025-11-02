FROM oven/bun:latest

WORKDIR /app

# ENV NODE_ENV=production

COPY package.json .

RUN bun install

COPY . .

EXPOSE 5000

CMD [ "bun", "run", "src/index.ts" ]