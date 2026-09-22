import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

import type { NextFunction, Request, Response } from 'express';

import { USER_ROLES, USER_STATUSES } from '../constants/auth';
import { authenticate } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/role.middleware';
import type { HttpError } from '../types/errors';

//===============================================================

test('article availability route requires authentication and pharmacy role', async () => {
  const routes = await readFile(
    resolve(process.cwd(), 'src/routes/product-request.routes.ts'),
    'utf8'
  );

  assert.match(
    routes,
    /'\/article-availability',[\s\S]*?authorizeRoles\(USER_ROLES\.PHARMACY\)[\s\S]*?productRequestArticleAvailabilityQuerySchema/
  );

  let anonymousError: unknown;

  await authenticate(
    { headers: {} } as Request,
    {} as Response,
    ((error?: unknown) => {
      anonymousError = error;
    }) as NextFunction
  );

  assert.equal((anonymousError as HttpError).status, 401);

  let clientError: unknown;
  authorizeRoles(USER_ROLES.PHARMACY)(
    {
      user: {
        id: '507f1f77bcf86cd799439011',
        name: 'Client User',
        email: 'client@example.com',
        role: USER_ROLES.CLIENT,
        status: USER_STATUSES.ACTIVE,
      },
    } as Request,
    {} as Response,
    ((error?: unknown) => {
      clientError = error;
    }) as NextFunction
  );

  assert.equal((clientError as HttpError).status, 403);
});
