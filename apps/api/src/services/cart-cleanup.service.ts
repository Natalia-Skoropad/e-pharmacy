import { cleanupExpiredCartItemsService } from './cart.service';
import { logger } from '../utils/logger';

//===============================================================

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

//===============================================================

export function startCartCleanupJob(): NodeJS.Timeout {
  const timer = setInterval(() => {
    void cleanupExpiredCartItemsService()
      .then((removedItems) => {
        if (removedItems > 0) {
          logger.info(`Removed ${removedItems} expired cart item(s).`);
        }
      })

      .catch((error: unknown) => {
        logger.error('Failed to remove expired cart items.', error);
      });
  }, CLEANUP_INTERVAL_MS);

  timer.unref();
  return timer;
}
