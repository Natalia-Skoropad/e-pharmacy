import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import path from 'path';

import { env } from './config/env';
import { errorMiddleware } from './middlewares/error.middleware';
import { notFoundMiddleware } from './middlewares/notFound.middleware';
import { validateMutationOrigin } from './middlewares/origin.middleware';
import { attachRequestContext } from './middlewares/request-context.middleware';
import { routes } from './routes';

//===============================================================

export const app = express();

const publicImagesPath = path.resolve(__dirname, '..', 'public', 'images');

//===============================================================

// Render and Vercel sit behind proxies and send X-Forwarded-* headers.
// Security rate-limit middleware uses req.ip as one of its distributed Mongo
// keys, so Express must trust the first deployment proxy to resolve client IPs
// correctly in production.
app.set('trust proxy', 1);

//===============================================================

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

//===============================================================

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

//===============================================================

app.use(attachRequestContext);
app.use(validateMutationOrigin);

//===============================================================

app.use(
  '/images',
  express.static(publicImagesPath, {
    immutable: true,
    maxAge: '30d',
  })
);

//===============================================================

app.use(express.json({ limit: '32mb' }));

//===============================================================

app.use(routes);

//===============================================================

app.use(notFoundMiddleware);
app.use(errorMiddleware);
