import dotenv from 'dotenv';

dotenv.config();

//===============================================================

type NodeEnv = 'development' | 'test' | 'production';

//===============================================================

function getNodeEnv(): NodeEnv {
  const value = process.env.NODE_ENV || 'development';

  if (value === 'development' || value === 'test' || value === 'production') {
    return value;
  }

  return 'development';
}

//===============================================================

function getPort(): number {
  const value = process.env.PORT;

  if (!value) return 4000;

  const port = Number(value);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error('PORT must be a positive number');
  }

  return port;
}

//===============================================================

export const env = {
  NODE_ENV: getNodeEnv(),
  PORT: getPort(),
} as const;
