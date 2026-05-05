import cors from 'cors';
import express from 'express';

import { errorMiddleware } from './middlewares/error.middleware';
import { notFoundMiddleware } from './middlewares/notFound.middleware';
import { routes } from './routes';

//===============================================================

export const app = express();

//===============================================================

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());

app.use(routes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);
