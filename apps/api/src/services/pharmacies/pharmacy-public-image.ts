import { Types } from 'mongoose';

import { HTTP_STATUS } from '../../constants/http/httpStatus';
import { API_MESSAGES } from '../../constants/shared/messages';

import { Pharmacy } from '../../models/pharmacies/pharmacy.model';
import { httpError } from '../../utils/http/httpError';
import { PUBLIC_PHARMACY_STATUS_FILTER } from './pharmacy-public-status';

//===================================================================

// Public list/options responses return a same-origin lazy image URL instead of
// embedding hundreds of kilobytes of base64 data in their JSON. The calculation
// runs inside MongoDB, so the large original field never crosses the wire.
// External photo URLs are preserved unchanged.
export const PUBLIC_PHARMACY_IMAGE_PROJECTION = {
  $let: {
    vars: { image: { $ifNull: ['$imageUrl', ''] } },

    in: {
      $cond: [
        {
          $regexMatch: {
            input: '$$image',
            regex: /^data:image\/(?:jpeg|png|webp);base64,/i,
          },
        },
        { $concat: ['/api/pharmacies/', { $toString: '$_id' }, '/photo'] },
        '$$image',
      ],
    },
  },
};

//===================================================================

// This endpoint is called only by the client BFF's image route, never during a
// catalog/search JSON request. It requires current public visibility, so
// blocked/unpublished pharmacies do not expose their private draft photos.
export async function getPublicPharmacyPhotoSource(pharmacyId: string) {
  const pharmacy = await Pharmacy.findOne({
    _id: new Types.ObjectId(pharmacyId),
    status: PUBLIC_PHARMACY_STATUS_FILTER,
  })
    .select('_id imageUrl')
    .lean();

  if (!pharmacy?.imageUrl?.startsWith('data:image/')) {
    throw httpError(HTTP_STATUS.NOT_FOUND, API_MESSAGES.PHARMACY_NOT_FOUND);
  }

  const match =
    /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/i.exec(
      pharmacy.imageUrl
    );

  if (!match) {
    throw httpError(HTTP_STATUS.NOT_FOUND, API_MESSAGES.PHARMACY_NOT_FOUND);
  }

  return {
    mimeType: match[1].toLowerCase(),
    bytes: Buffer.from(match[2], 'base64'),
  };
}
