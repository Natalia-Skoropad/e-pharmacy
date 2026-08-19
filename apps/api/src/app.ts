import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import path from 'path';

import { env } from './config/env';
import { API_JSON_BODY_LIMITS } from './constants/request-body';
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
      if (!origin || env.TRUSTED_APP_ORIGINS.includes(origin)) {
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

// Large base64 document/attachment payloads are opt-in. All ordinary JSON
// requests use the much smaller standard limit so auth/cart/profile endpoints
// cannot make Express buffer tens of megabytes before route middleware runs.
for (const routePath of [
  '/auth/pharmacy-documents',
  '/pharmacies/me/documents',
  '/product-requests',
]) {
  app.use(
    routePath,
    express.json({ limit: API_JSON_BODY_LIMITS.documentUpload })
  );
}

app.use(express.json({ limit: API_JSON_BODY_LIMITS.standardJson }));

//===============================================================

app.use(routes);

//===============================================================

app.use(notFoundMiddleware);
app.use(errorMiddleware);
