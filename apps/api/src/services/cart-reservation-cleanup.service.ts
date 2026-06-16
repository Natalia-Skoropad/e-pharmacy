import { releaseExpiredCartReservationsService } from './cart.service';
import { logger } from '../utils/logger';

//===============================================================

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

//===============================================================

export function startCartReservationCleanupJob(): NodeJS.Timeout {
  const timer = setInterval(() => {
    void releaseExpiredCartReservationsService()
      .then((releasedItems) => {
        if (releasedItems > 0) {
          logger.info(`Released ${releasedItems} expired cart reservation(s).`);
        }
      })
      .catch((error: unknown) => {
        logger.error('Failed to release expired cart reservations.', error);
      });
  }, CLEANUP_INTERVAL_MS);

  timer.unref();
  return timer;
}
