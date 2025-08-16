import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { PasswordService } from '../utils/password';
import { JWTService } from '../utils/jwt';

interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface RefreshTokenRequest {
  refreshToken: string;
}

class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, name }: RegisterRequest = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        res.status(409).json({
          error: 'User already exists',
          message: 'このメールアドレスは既に登録されています',
        });
        return;
      }

      // Hash password
      const hashedPassword = await PasswordService.hashPassword(password);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
      });

      // Generate tokens
      const tokenPayload = { userId: user.id, email: user.email };
      const accessToken = JWTService.generateAccessToken(tokenPayload);
      const refreshToken = JWTService.generateRefreshToken(tokenPayload);

      // Store refresh token in database
      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      // Store refresh token in Redis
      await JWTService.storeRefreshToken(user.id, refreshToken);

      res.status(201).json({
        message: 'User registered successfully',
        user,
        tokens: {
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password }: LoginRequest = req.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        res.status(401).json({
          error: 'Invalid credentials',
          message: 'メールアドレスまたはパスワードが正しくありません',
        });
        return;
      }

      // Verify password
      const isPasswordValid = await PasswordService.comparePassword(password, user.password);

      if (!isPasswordValid) {
        res.status(401).json({
          error: 'Invalid credentials',
          message: 'メールアドレスまたはパスワードが正しくありません',
        });
        return;
      }

      // Generate tokens
      const tokenPayload = { userId: user.id, email: user.email };
      const accessToken = JWTService.generateAccessToken(tokenPayload);
      const refreshToken = JWTService.generateRefreshToken(tokenPayload);

      // Clean up old refresh tokens
      await prisma.refreshToken.deleteMany({
        where: {
          userId: user.id,
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      // Store new refresh token
      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      // Store refresh token in Redis
      await JWTService.storeRefreshToken(user.id, refreshToken);

      const userResponse = {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      };

      res.status(200).json({
        message: 'Login successful',
        user: userResponse,
        tokens: {
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken }: RefreshTokenRequest = req.body;

      if (!refreshToken) {
        res.status(400).json({
          error: 'Refresh token required',
          message: 'リフレッシュトークンが必要です',
        });
        return;
      }

      // Verify refresh token
      const decoded = JWTService.verifyRefreshToken(refreshToken);

      // Check if token exists in database
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        res.status(401).json({
          error: 'Invalid refresh token',
          message: 'リフレッシュトークンが無効です',
        });
        return;
      }

      // Check Redis
      const redisToken = await JWTService.getStoredRefreshToken(decoded.userId);
      if (redisToken !== refreshToken) {
        res.status(401).json({
          error: 'Invalid refresh token',
          message: 'リフレッシュトークンが無効です',
        });
        return;
      }

      // Generate new tokens
      const tokenPayload = { userId: decoded.userId, email: decoded.email };
      const newAccessToken = JWTService.generateAccessToken(tokenPayload);
      const newRefreshToken = JWTService.generateRefreshToken(tokenPayload);

      // Update refresh token in database
      await prisma.refreshToken.update({
        where: { token: refreshToken },
        data: {
          token: newRefreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      // Update refresh token in Redis
      await JWTService.storeRefreshToken(decoded.userId, newRefreshToken);

      const userResponse = {
        id: storedToken.user.id,
        email: storedToken.user.email,
        name: storedToken.user.name,
        createdAt: storedToken.user.createdAt,
      };

      res.status(200).json({
        message: 'Token refreshed successfully',
        user: userResponse,
        tokens: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'JsonWebTokenError') {
        res.status(401).json({
          error: 'Invalid refresh token',
          message: 'リフレッシュトークンが無効です',
        });
        return;
      }
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      const { refreshToken }: { refreshToken?: string } = req.body;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const accessToken = authHeader.substring(7);
        // Blacklist the access token
        await JWTService.blacklistToken(accessToken);
      }

      if (refreshToken) {
        const decoded = JWTService.verifyRefreshToken(refreshToken);
        
        // Remove refresh token from database
        await prisma.refreshToken.deleteMany({
          where: { token: refreshToken },
        });

        // Remove refresh token from Redis
        await JWTService.removeRefreshToken(decoded.userId);
      }

      res.status(200).json({
        message: 'Logout successful',
      });
    } catch (error) {
      // Even if there's an error, we should respond with success
      // to prevent information leakage
      res.status(200).json({
        message: 'Logout successful',
      });
    }
  }
}

export const authController = new AuthController();