import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { env } from './config/env';
import { errorMiddleware } from './middlewares/error.middleware';
import { notFoundMiddleware } from './middlewares/notFound.middleware';
import { validateMutationOrigin } from './middlewares/origin.middleware';
import { routes } from './routes';

//===============================================================

export const app = express();

// Render and Vercel sit behind proxies and send X-Forwarded-* headers.
// express-rate-limit needs Express to trust the first proxy to resolve
// client IPs correctly in production.
app.set('trust proxy', 1);

//===============================================================

app.use(helmet());

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.CLIENT_ORIGINS.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(validateMutationOrigin);

app.use(express.json({ limit: '2mb' }));

app.use(routes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);
