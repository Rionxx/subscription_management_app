import { Request, Response, NextFunction } from 'express';
import { JWTService } from '../utils/jwt';
import { prisma } from '../config/database';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (!token) {
      res.status(401).json({
        error: 'Access token required',
        message: 'アクセストークンが必要です',
      });
      return;
    }

    // Check if token is blacklisted
    const isBlacklisted = await JWTService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      res.status(401).json({
        error: 'Token has been revoked',
        message: 'トークンが無効化されています',
      });
      return;
    }

    // Verify token
    const decoded = JWTService.verifyAccessToken(token);

    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true },
    });

    if (!user) {
      res.status(401).json({
        error: 'User not found',
        message: 'ユーザーが見つかりません',
      });
      return;
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'JsonWebTokenError') {
        res.status(401).json({
          error: 'Invalid token',
          message: 'トークンが無効です',
        });
        return;
      } else if (error.name === 'TokenExpiredError') {
        res.status(401).json({
          error: 'Token expired',
          message: 'トークンの有効期限が切れています',
        });
        return;
      }
    }
    next(error);
  }
}

export { AuthenticatedRequest };