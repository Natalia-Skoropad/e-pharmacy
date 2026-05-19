import mongoose from 'mongoose';

import { env } from '../config/env';
import { logger } from '../utils/logger';

//===============================================================

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI);

    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error('MongoDB connection failed');

    if (error instanceof Error) {
      logger.error(error.message);
    }

    process.exit(1);
  }
}
