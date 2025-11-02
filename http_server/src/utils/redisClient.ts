import { createClient } from "@redis/client";
import type { RedisClientType } from "redis";

export class RedisManager {
  private static instance: RedisManager;
  private pubclient: RedisClientType;
  private subclient: RedisClientType;

  private constructor() {
    this.pubclient = createClient({
      url: "redis://redis_service:6379",
    });
    this.subclient = createClient({
      url: "redis://redis_service:6379",
    });
  }

  static async getInstance() {
    if (!RedisManager.instance) {
      const manager = new RedisManager();
      await manager.connect();
      RedisManager.instance = manager;
    }
    return this.instance;
  }

  private async connect() {
    await this.pubclient.connect(), await this.subclient.connect();
  }

  async publish(channel: string, message: any) {
    const msg = JSON.stringify(message);
    await this.pubclient.publish(channel, msg);
  }

  async getlatestprice(asset: string) {
    this.subclient.subscribe(asset, (msg) => {
      if (msg) {
      }
    });
  }

  async subscribe(channel: string, callback: any) {
    await this.subclient.subscribe(channel, (msg) => {
      callback(msg);
    });
  }

  async disconnect() {
    await this.pubclient.destroy();
    await this.subclient.destroy();
  }
}
