import { env } from '../config/env';

//===============================================================

type LogMeta = Record<string, unknown>;

//===============================================================

function shouldLogInfo(): boolean {
  return env.NODE_ENV !== 'production';
}

//===============================================================

export const logger = {
  info(message: string, meta?: LogMeta): void {
    if (!shouldLogInfo()) return;

    if (meta) {
      console.warn(message, meta);
      return;
    }

    console.warn(message);
  },

  request(meta: LogMeta): void {
    process.stdout.write(
      `${JSON.stringify({ event: 'api_request', ...meta })}\n`
    );
  },

  security(meta: LogMeta): void {
    process.stdout.write(
      `${JSON.stringify({ event: 'security_event', ...meta })}\n`
    );
  },

  error(message: string, error?: unknown): void {
    if (error) {
      console.error(message, error);
      return;
    }

    console.error(message);
  },
};
