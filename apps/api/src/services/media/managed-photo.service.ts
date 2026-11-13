import { randomBytes } from 'node:crypto';
import mongoose from 'mongoose';
import sharp from 'sharp';
import { HTTP_STATUS } from '../../constants/http/httpStatus';
import { httpError } from '../../utils/http/httpError';

//===================================================================

// Uploaded media is immutable. Persist the master and presentation sizes as
// independent GridFS files, never as base64 in pharmacy/product documents.
export type ManagedPhotoSize = 'thumb' | 'medium' | 'large';

//===================================================================

const DIMENSIONS: Readonly<Record<ManagedPhotoSize, number>> = {
  thumb: 256,
  medium: 768,
  large: 1536,
};

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const MEDIA_ID = /^[a-f0-9]{24}$/;

const DATA_URL =
  /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/i;

//===================================================================

type StoredFileId = InstanceType<typeof mongoose.mongo.ObjectId>;

//===================================================================

function bucket() {
  if (!mongoose.connection.db)
    throw new Error('Media database is not connected.');

  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: 'mediaPhotos',
  });
}

//===================================================================

function parseDataUrl(dataUrl: string): Buffer {
  if (dataUrl.length > Math.ceil((MAX_UPLOAD_BYTES * 4) / 3) + 100) {
    throw httpError(
      HTTP_STATUS.BAD_REQUEST,
      'Photo exceeds the 10 MB source limit.'
    );
  }

  const match = DATA_URL.exec(dataUrl);

  if (!match)
    throw httpError(
      HTTP_STATUS.BAD_REQUEST,
      'Expected a JPEG, PNG or WebP photo.'
    );

  const bytes = Buffer.from(match[2], 'base64');

  if (!bytes.length || bytes.length > MAX_UPLOAD_BYTES) {
    throw httpError(
      HTTP_STATUS.BAD_REQUEST,
      'Photo exceeds the 10 MB source limit.'
    );
  }

  return bytes;
}

//===================================================================

function mediaName(id: string, size: ManagedPhotoSize | 'master'): string {
  return `${id}-${size}`;
}

//===================================================================

function publicUrl(id: string): string {
  return `/api/media/${id}/large`;
}

//===================================================================

async function writeFile(
  id: string,
  size: ManagedPhotoSize | 'master',
  bytes: Buffer,
  mimeType: string
): Promise<StoredFileId> {
  const stream = bucket().openUploadStream(mediaName(id, size), {
    metadata: { photoId: id, size, contentType: mimeType },
  });

  await new Promise<void>((resolve, reject) => {
    stream.once('finish', resolve);
    stream.once('error', reject);
    stream.end(bytes);
  });

  return stream.id as StoredFileId;
}

//===================================================================

/**
 * Sharp decodes the source once per derivative, keeps the original master,
 * strips EXIF/GPS from public variants and respects orientation. No upscaling.
 * A 96-bit random ID prevents enumerable filenames for pending/unpublished art.
 */
export async function storeManagedPhoto(
  dataUrl: string
): Promise<{ url: string; size: number }> {
  const original = parseDataUrl(dataUrl);

  let metadata: sharp.Metadata;

  try {
    metadata = await sharp(original, {
      limitInputPixels: 30_000_000,
    }).metadata();
  } catch {
    throw httpError(HTTP_STATUS.BAD_REQUEST, 'Invalid or unsupported image.');
  }

  if (!['jpeg', 'png', 'webp'].includes(metadata.format ?? '')) {
    throw httpError(HTTP_STATUS.BAD_REQUEST, 'Unsupported image encoding.');
  }

  if (
    !metadata.width ||
    !metadata.height ||
    metadata.width * metadata.height > 30_000_000
  ) {
    throw httpError(HTTP_STATUS.BAD_REQUEST, 'Invalid image dimensions.');
  }

  const id = randomBytes(12).toString('hex');
  const uploaded: StoredFileId[] = [];

  let largeBytes = 0;

  try {
    const masterMime =
      metadata.format === 'jpeg'
        ? 'image/jpeg'
        : metadata.format === 'png'
          ? 'image/png'
          : 'image/webp';

    uploaded.push(await writeFile(id, 'master', original, masterMime));

    for (const size of ['thumb', 'medium', 'large'] as const) {
      const bytes = await sharp(original, { limitInputPixels: 30_000_000 })
        .rotate()
        .resize(DIMENSIONS[size], DIMENSIONS[size], {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({
          quality: size === 'thumb' ? 78 : size === 'medium' ? 82 : 86,
          effort: 4,
        })
        .toBuffer();

      uploaded.push(await writeFile(id, size, bytes, 'image/webp'));

      if (size === 'large') largeBytes = bytes.length;
    }

    return { url: publicUrl(id), size: largeBytes };
  } catch (error) {
    // Partial failed uploads must not leave orphan files.
    await Promise.allSettled(uploaded.map((fileId) => bucket().delete(fileId)));

    throw error;
  }
}

//===================================================================

export async function readManagedPhoto(
  id: string,
  size: ManagedPhotoSize
): Promise<Buffer | null> {
  if (!MEDIA_ID.test(id) || !(size in DIMENSIONS)) return null;

  const mediaBucket = bucket();

  const [file] = await mediaBucket
    .find({ filename: mediaName(id, size) })
    .limit(1)
    .toArray();

  if (!file) return null;

  const pieces: Buffer[] = [];

  for await (const chunk of mediaBucket.openDownloadStream(file._id)) {
    pieces.push(Buffer.from(chunk));
  }

  return Buffer.concat(pieces);
}

//===================================================================

export function isManagedPhotoUrl(url: string): boolean {
  return /^\/api\/media\/[a-f0-9]{24}\/(?:thumb|medium|large)$/.test(url);
}
