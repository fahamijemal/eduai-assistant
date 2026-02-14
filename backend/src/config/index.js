import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/eduai',
  jwtSecret: process.env.JWT_SECRET || 'eduai-jwt-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  aiQuotaPerUser: parseInt(process.env.AI_QUOTA_PER_USER, 10) || 100,
  rateLimitWindow: 15 * 60 * 1000, // 15 min
  rateLimitMax: 100,
};
