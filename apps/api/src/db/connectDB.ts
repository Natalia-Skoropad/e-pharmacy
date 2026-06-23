import mongoose from 'mongoose';

import { env } from '../config/env';
import { logger } from '../utils/logger';

//===============================================================

const MONGO_SERVER_SELECTION_TIMEOUT_MS = 5_000;

//===============================================================

export async function connectDB(): Promise<void> {
  const startedAt = Date.now();

  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: MONGO_SERVER_SELECTION_TIMEOUT_MS,
    });

    logger.info('MongoDB connected successfully', {
      durationMs: Date.now() - startedAt,
    });
  } catch (error) {
    logger.error('MongoDB connection failed', {
      durationMs: Date.now() - startedAt,
      timeoutMs: MONGO_SERVER_SELECTION_TIMEOUT_MS,
    });

    if (error instanceof Error) {
      logger.error(error.message);
    }

    process.exit(1);
  }
}
