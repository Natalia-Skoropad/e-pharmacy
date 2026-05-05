import { app } from './app';
import { env } from './config/env';
import { connectDB } from './db/connectDB';

//===============================================================

async function startServer(): Promise<void> {
  await connectDB();

  app.listen(env.PORT, () => {
    console.log(`API is running on http://localhost:${env.PORT}`);
  });
}

//===============================================================

void startServer();
