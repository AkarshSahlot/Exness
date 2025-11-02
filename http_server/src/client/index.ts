import { Client } from "pg";
import { createClient } from "redis";

export const pgClient = new Client({
  host: "localhost",
  port: 5433,
  user: "user",
  password: "XYZ@123",
  database: "trades_db",
});

export const redisclient = createClient().connect();
