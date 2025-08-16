import jwt from 'jsonwebtoken';
import { getRedisClient } from '../config/redis';

interface TokenPayload {
  userId: string;
  email: string;
}

export class JWTService {
  private static readonly ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  private static readonly REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
  private static readonly ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
  private static readonly REFRESH_TOKEN_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

  static generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.ACCESS_TOKEN_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRES_IN,
    });
  }

  static generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.REFRESH_TOKEN_SECRET, {
      expiresIn: this.REFRESH_TOKEN_EXPIRES_IN,
    });
  }

  static verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, this.ACCESS_TOKEN_SECRET) as TokenPayload;
  }

  static verifyRefreshToken(token: string): TokenPayload {
    return jwt.verify(token, this.REFRESH_TOKEN_SECRET) as TokenPayload;
  }

  static async storeRefreshToken(userId: string, token: string): Promise<void> {
    const redis = getRedisClient();
    const key = `refresh_token:${userId}`;
    
    // 7日間の有効期限を設定
    await redis.setEx(key, 7 * 24 * 60 * 60, token);
  }

  static async getStoredRefreshToken(userId: string): Promise<string | null> {
    const redis = getRedisClient();
    const key = `refresh_token:${userId}`;
    return await redis.get(key);
  }

  static async removeRefreshToken(userId: string): Promise<void> {
    const redis = getRedisClient();
    const key = `refresh_token:${userId}`;
    await redis.del(key);
  }

  static async blacklistToken(token: string): Promise<void> {
    const redis = getRedisClient();
    const key = `blacklist:${token}`;
    
    try {
      const decoded = jwt.decode(token) as any;
      if (decoded && decoded.exp) {
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          await redis.setEx(key, ttl, 'blacklisted');
        }
      }
    } catch (error) {
      console.error('Error blacklisting token:', error);
    }
  }

  static async isTokenBlacklisted(token: string): Promise<boolean> {
    const redis = getRedisClient();
    const key = `blacklist:${token}`;
    const result = await redis.get(key);
    return result === 'blacklisted';
  }
}