import { createHash } from 'node:crypto';

import { HTTP_STATUS } from '../constants/httpStatus';
import { httpError } from './httpError';

//===================================================================

type DocumentUploadInput = Readonly<{
  name: string;
  size: number;
  type: string;
  dataUrl: string;
}>;

type DocumentUploadRules = Readonly<{
  maxSizeBytes: number;
  mimeTypes: readonly string[];
}>;

export type VerifiedDocumentUpload = Readonly<{
  content: Buffer;
  size: number;
  type: string;
  sha256: string;
}>;

//===================================================================

function decodeBase64DataUrl(dataUrl: string): {
  content: Buffer;
  declaredDataUrlType: string;
} {
  const match = /^data:([^;,]+);base64,([A-Za-z0-9+/=]+)$/i.exec(dataUrl);

  if (!match) {
    throw httpError(HTTP_STATUS.BAD_REQUEST, 'Document content is invalid.');
  }

  try {
    const content = Buffer.from(match[2], 'base64');

    if (content.toString('base64') !== match[2]) {
      throw new Error('Non-canonical base64');
    }

    return {
      content,
      declaredDataUrlType: match[1].trim().toLowerCase(),
    };
  } catch {
    throw httpError(HTTP_STATUS.BAD_REQUEST, 'Document content is invalid.');
  }
}

//===================================================================

function hasPrefix(buffer: Buffer, bytes: readonly number[]): boolean {
  if (buffer.length < bytes.length) return false;
  return bytes.every((byte, index) => buffer[index] === byte);
}

//===================================================================

function hasAscii(buffer: Buffer, offset: number, value: string): boolean {
  return (
    buffer.length >= offset + value.length &&
    buffer.subarray(offset, offset + value.length).toString('ascii') === value
  );
}

//===================================================================

function detectDocumentMimeType(
  buffer: Buffer,
  declaredType: string
): string | null {
  if (hasAscii(buffer, 0, '%PDF-')) return 'application/pdf';
  if (hasPrefix(buffer, [0xff, 0xd8, 0xff])) return 'image/jpeg';

  if (hasPrefix(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return 'image/png';
  }

  if (hasAscii(buffer, 0, 'RIFF') && hasAscii(buffer, 8, 'WEBP')) {
    return 'image/webp';
  }

  if (hasPrefix(buffer, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) {
    return 'application/msword';
  }

  if (hasPrefix(buffer, [0x50, 0x4b, 0x03, 0x04])) {
    const looksLikeDocx =
      buffer.includes(Buffer.from('[Content_Types].xml')) &&
      buffer.includes(Buffer.from('word/'));

    return declaredType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' &&
      looksLikeDocx
      ? declaredType
      : null;
  }

  return null;
}

//===================================================================

function hasExpectedFileExtension(name: string, type: string): boolean {
  const extension = name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  const allowedExtensions: Readonly<Record<string, readonly string[]>> = {
    'application/pdf': ['pdf'],
    'application/msword': ['doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
      'docx',
    ],
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/webp': ['webp'],
  };

  return Boolean(extension && allowedExtensions[type]?.includes(extension));
}

//===================================================================

export function decodeAndVerifyDocumentUpload(
  input: DocumentUploadInput,
  rules: DocumentUploadRules
): VerifiedDocumentUpload {
  const { content, declaredDataUrlType } = decodeBase64DataUrl(input.dataUrl);
  const normalizedType = input.type.trim().toLowerCase();
  const size = content.byteLength;

  if (
    !rules.mimeTypes.includes(normalizedType) ||
    declaredDataUrlType !== normalizedType
  ) {
    throw httpError(
      HTTP_STATUS.BAD_REQUEST,
      'Document MIME type does not match the upload payload.'
    );
  }

  if (size !== input.size || size <= 0 || size > rules.maxSizeBytes) {
    throw httpError(
      HTTP_STATUS.BAD_REQUEST,
      'Document size does not match the uploaded content.'
    );
  }

  const detectedType = detectDocumentMimeType(content, normalizedType);

  if (
    !detectedType ||
    detectedType !== normalizedType ||
    !hasExpectedFileExtension(input.name, detectedType)
  ) {
    throw httpError(
      HTTP_STATUS.BAD_REQUEST,
      'Document MIME type does not match the uploaded content.'
    );
  }

  return {
    content,
    size,
    type: detectedType,
    sha256: createHash('sha256').update(content).digest('hex'),
  };
}
