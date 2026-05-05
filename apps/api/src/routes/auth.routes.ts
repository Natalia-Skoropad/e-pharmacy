import { Router } from 'express';

import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
} from '../controllers/auth.controller';

import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { loginSchema, registerSchema } from '../schemas/auth.schema';
import { ctrlWrapper } from '../utils/ctrlWrapper';

//===============================================================

export const authRoutes = Router();

//===============================================================

authRoutes.post(
  '/register',
  validate({
    body: registerSchema,
  }),
  ctrlWrapper(registerUser)
);

authRoutes.post(
  '/login',
  validate({
    body: loginSchema,
  }),
  ctrlWrapper(loginUser)
);

authRoutes.get('/current', authenticate, ctrlWrapper(getCurrentUser));

authRoutes.post('/logout', authenticate, ctrlWrapper(logoutUser));
