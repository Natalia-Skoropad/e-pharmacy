import jwt from 'jsonwebtoken';

import { env } from '../config/env';
import type { UserRole } from '../types/user';

//===============================================================

export type JwtPayload = {
  userId: string;
  role: UserRole;
};

//===============================================================

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

//===============================================================

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}
