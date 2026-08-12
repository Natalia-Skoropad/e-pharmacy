import { app } from './app';
import { env } from './config/env';
import { connectDB } from './db/connectDB';
import { startCartCleanupJob } from './services/cart-cleanup.service';
import { logger } from './utils/logger';

//===============================================================

async function startServer(): Promise<void> {
  await connectDB();
  startCartCleanupJob();

  app.listen(env.PORT, () => {
    logger.info(`API is running on http://localhost:${env.PORT}`);
  });
}

//===============================================================

void startServer();
