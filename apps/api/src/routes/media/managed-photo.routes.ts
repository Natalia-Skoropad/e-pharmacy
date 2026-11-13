import { Router } from 'express';
import { z } from 'zod';

import { USER_ROLES } from '../../constants/auth/auth';

import {
  uploadManagedPhoto,
  getManagedPhoto,
} from '../../controllers/media/managed-photo.controller';

import { authenticate } from '../../middlewares/auth/auth.middleware';
import { authorizeRoles } from '../../middlewares/auth/role.middleware';
import { managedPhotoUploadRateLimit } from '../../middlewares/security/rateLimit.middleware';
import { validate } from '../../middlewares/http/validate.middleware';

import { ctrlWrapper } from '../../utils/http/ctrlWrapper';

//===================================================================

export const managedPhotoRoutes = Router();

//===================================================================

// A public, unguessable, immutable URL only serves display variants, not the
// original master. The upload action itself always requires authentication.
managedPhotoRoutes.get(
  '/:photoId/:size',

  validate({
    params: z
      .object({
        photoId: z.string().regex(/^[a-f0-9]{24}$/),
        size: z.enum(['thumb', 'medium', 'large']),
      })
      .strict(),
  }),

  ctrlWrapper(getManagedPhoto)
);

//===================================================================

managedPhotoRoutes.post(
  '/photos',
  authenticate,
  authorizeRoles(USER_ROLES.PHARMACY, USER_ROLES.ADMIN),
  managedPhotoUploadRateLimit,

  validate({
    body: z
      .object({
        dataUrl: z
          .string()
          .max(14_000_000)
          .regex(/^data:image\/(?:jpeg|png|webp);base64,/),
      })
      .strict(),
  }),

  ctrlWrapper(uploadManagedPhoto)
);
