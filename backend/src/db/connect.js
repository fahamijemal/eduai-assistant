import mongoose from 'mongoose';
import { config } from '../config/index.js';

export async function connectDb() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
}
