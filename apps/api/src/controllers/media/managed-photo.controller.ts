import type { Request, Response } from 'express';

import {
  readManagedPhoto,
  storeManagedPhoto,
  type ManagedPhotoSize,
} from '../../services/media/managed-photo.service';

import { sendSuccessResponse } from '../../utils/http/apiResponse';

//===================================================================

export async function uploadManagedPhoto(
  req: Request,
  res: Response
): Promise<void> {
  const result = await storeManagedPhoto(req.body.dataUrl as string);

  sendSuccessResponse({
    res,
    statusCode: 201,
    data: { ...result, type: 'image/webp' },
  });
}

//===================================================================

export async function getManagedPhoto(
  req: Request,
  res: Response
): Promise<void> {
  const bytes = await readManagedPhoto(
    req.params.photoId as string,
    req.params.size as ManagedPhotoSize
  );

  if (!bytes) {
    res.status(404).end();
    return;
  }

  res.setHeader('Content-Type', 'image/webp');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.status(200).send(bytes);
}
