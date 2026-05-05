import bcrypt from 'bcryptjs';

import { PASSWORD_SALT_ROUNDS } from '../constants/auth';

//===============================================================

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
}

//===============================================================

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
