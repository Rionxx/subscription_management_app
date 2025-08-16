import dotenv from 'dotenv';
import app from './app';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';

// 環境変数の読み込み
dotenv.config();

const PORT = process.env.PORT || 3001;

async function startServer(): Promise<void> {
  try {
    // データベース接続
    await connectDatabase();
    console.log('✅ Database connected successfully');

    // Redis接続
    await connectRedis();
    console.log('✅ Redis connected successfully');

    // サーバー起動
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

startServer();