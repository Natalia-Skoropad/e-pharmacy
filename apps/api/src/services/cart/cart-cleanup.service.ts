import { cleanupExpiredCartItemsService } from './cart.service';
import { logger } from '../../utils/logging/logger';

//===============================================================

export async function runCartCleanupOnce(): Promise<number> {
  const removedItems = await cleanupExpiredCartItemsService();

  if (removedItems > 0) {
    logger.info(`Removed ${removedItems} expired cart item(s).`);
  }

  return removedItems;
}
