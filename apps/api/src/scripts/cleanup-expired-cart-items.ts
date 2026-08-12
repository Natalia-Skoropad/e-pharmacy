import mongoose from 'mongoose';

import { connectDB } from '../db/connectDB';
import { runCartCleanupOnce } from '../services/cart-cleanup.service';
import { logger } from '../utils/logger';

//===============================================================

async function main(): Promise<void> {
  await connectDB();

  try {
    const removedItems = await runCartCleanupOnce();
    logger.info(`Cart cleanup completed (${removedItems} item(s) removed).`);
  } finally {
    await mongoose.disconnect();
  }
}

//===============================================================

void main().catch((error: unknown) => {
  logger.error('Cart cleanup failed.');

  if (error instanceof Error) {
    logger.error(error.message);
  }

  process.exitCode = 1;
});
