FROM node:22-alpine

WORKDIR /app

RUN npm i -g bun

COPY package.json bun.lockb* ./

RUN bun install


COPY . .

ENV DATABASE_URL=postgresql://user:XYZ%40123@timescale_db:5432/trades_db

EXPOSE 5000

CMD ["sh", "-c", "bunx prisma db push && bun seed.ts && bun run src/index.ts "]

