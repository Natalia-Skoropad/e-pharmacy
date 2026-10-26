import { app } from './app';
import { env } from './config/env';
import { connectDB } from './db/connectDB';
import { logger } from './utils/logging/logger';

//===============================================================

async function startServer(): Promise<void> {
  await connectDB();

  app.listen(env.PORT, () => {
    logger.info(`API is running on http://localhost:${env.PORT}`);
  });
}

//===============================================================

void startServer();
