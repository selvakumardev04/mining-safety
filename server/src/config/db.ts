import mongoose from 'mongoose';
import { env } from './env';

export async function initializeDatabase(): Promise<void> {
  if (!env.mongoUri) {
    console.warn('MONGODB_URI not configured. Running in demo mode with in-memory data.');
    return;
  }

  try {
    await mongoose.connect(env.mongoUri);
    console.log('MongoDB connected successfully.');
  } catch (error) {
    console.warn('MongoDB connection failed. Falling back to demo mode.', error);
  }
}
