import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { deflateRawSync, inflateRawSync } from 'node:zlib';

import {
  SOURCE_ARCHIVE_EXCLUDED_DIRECTORIES,
  SOURCE_ARCHIVE_EXCLUDED_FILE_PATTERNS,
} from './prepare-source-archive.mjs';

//===================================================================

const LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;
const CENTRAL_DIRECTORY_HEADER_SIGNATURE = 0x02014b50;
const END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50;
const UTF8_FLAG = 0x0800;
const STORED_METHOD = 0;
const DEFLATE_METHOD = 8;
const MAX_EOCD_SEARCH = 65_557;
const MAX_NESTED_ARCHIVE_DEPTH = 8;

//===================================================================

const crcTable = new Uint32Array(256);

for (let index = 0; index < 256; index += 1) {
  let value = index;

  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }

  crcTable[index] = value >>> 0;
}

//===================================================================

function crc32(buffer) {
  let value = 0xffffffff;

  for (const byte of buffer) {
    value = crcTable[(value ^ byte) & 0xff] ^ (value >>> 8);
  }

  return (value ^ 0xffffffff) >>> 0;
}

//===================================================================

function toDosDateTime(date) {
  const year = Math.max(1980, date.getFullYear());

  const dosTime =
    (date.getHours() << 11) |
    (date.getMinutes() << 5) |
    Math.floor(date.getSeconds() / 2);

  const dosDate =
    ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();

  return { dosDate, dosTime };
}

//===================================================================

function normalizeArchivePath(value) {
  return value.replaceAll('\\', '/').replace(/^\/+/, '');
}

//===================================================================

function isExcludedFile(relativePath) {
  const normalized = normalizeArchivePath(relativePath);

  return SOURCE_ARCHIVE_EXCLUDED_FILE_PATTERNS.some((pattern) => {
    pattern.lastIndex = 0;
    return pattern.test(normalized);
  });
}

//===================================================================

function hasForbiddenDirectory(relativePath) {
  const parts = normalizeArchivePath(relativePath).split('/');

  return parts.some((part) => SOURCE_ARCHIVE_EXCLUDED_DIRECTORIES.has(part));
}

//===================================================================

async function collectFiles(directory, relativeDirectory = '') {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relativePath = normalizeArchivePath(
      path.join(relativeDirectory, entry.name)
    );

    if (entry.isDirectory()) {
      if (SOURCE_ARCHIVE_EXCLUDED_DIRECTORIES.has(entry.name)) continue;

      files.push(
        ...(await collectFiles(path.join(directory, entry.name), relativePath))
      );
      continue;
    }

    if (!entry.isFile() || isExcludedFile(relativePath)) continue;

    files.push({
      absolutePath: path.join(directory, entry.name),
      relativePath,
    });
  }

  return files.sort((left, right) =>
    left.relativePath.localeCompare(right.relativePath)
  );
}

//===================================================================

export async function createSourceArchiveZip(sourceDirectory, outputPath) {
  const files = await collectFiles(sourceDirectory);
  const localParts = [];
  const centralParts = [];
  let localOffset = 0;

  for (const file of files) {
    const [content, fileStats] = await Promise.all([
      readFile(file.absolutePath),
      stat(file.absolutePath),
    ]);

    const compressedCandidate = deflateRawSync(content, { level: 9 });
    const useDeflate = compressedCandidate.length < content.length;
    const method = useDeflate ? DEFLATE_METHOD : STORED_METHOD;
    const compressed = useDeflate ? compressedCandidate : content;
    const fileName = Buffer.from(file.relativePath, 'utf8');
    const checksum = crc32(content);
    const { dosDate, dosTime } = toDosDateTime(fileStats.mtime);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(LOCAL_FILE_HEADER_SIGNATURE, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(UTF8_FLAG, 6);
    localHeader.writeUInt16LE(method, 8);
    localHeader.writeUInt16LE(dosTime, 10);
    localHeader.writeUInt16LE(dosDate, 12);
    localHeader.writeUInt32LE(checksum, 14);
    localHeader.writeUInt32LE(compressed.length, 18);
    localHeader.writeUInt32LE(content.length, 22);
    localHeader.writeUInt16LE(fileName.length, 26);
    localHeader.writeUInt16LE(0, 28);

    localParts.push(localHeader, fileName, compressed);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(CENTRAL_DIRECTORY_HEADER_SIGNATURE, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(UTF8_FLAG, 8);
    centralHeader.writeUInt16LE(method, 10);
    centralHeader.writeUInt16LE(dosTime, 12);
    centralHeader.writeUInt16LE(dosDate, 14);
    centralHeader.writeUInt32LE(checksum, 16);
    centralHeader.writeUInt32LE(compressed.length, 20);
    centralHeader.writeUInt32LE(content.length, 24);
    centralHeader.writeUInt16LE(fileName.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(localOffset, 42);

    centralParts.push(centralHeader, fileName);

    localOffset += localHeader.length + fileName.length + compressed.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);

  end.writeUInt32LE(END_OF_CENTRAL_DIRECTORY_SIGNATURE, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(localOffset, 16);
  end.writeUInt16LE(0, 20);

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(
    outputPath,
    Buffer.concat([...localParts, centralDirectory, end])
  );

  return {
    fileCount: files.length,
    outputPath,
  };
}

//===================================================================

function findEndOfCentralDirectory(buffer) {
  const minimumOffset = Math.max(0, buffer.length - MAX_EOCD_SEARCH);

  for (let offset = buffer.length - 22; offset >= minimumOffset; offset -= 1) {
    if (buffer.readUInt32LE(offset) === END_OF_CENTRAL_DIRECTORY_SIGNATURE) {
      return offset;
    }
  }

  throw new Error('ZIP end-of-central-directory record was not found.');
}

//===================================================================

function readZipEntriesFromBuffer(buffer) {
  const eocdOffset = findEndOfCentralDirectory(buffer);
  const entryCount = buffer.readUInt16LE(eocdOffset + 10);
  let centralOffset = buffer.readUInt32LE(eocdOffset + 16);
  const entries = [];

  for (let index = 0; index < entryCount; index += 1) {
    if (
      buffer.readUInt32LE(centralOffset) !== CENTRAL_DIRECTORY_HEADER_SIGNATURE
    ) {
      throw new Error('Invalid ZIP central directory header.');
    }

    const method = buffer.readUInt16LE(centralOffset + 10);
    const checksum = buffer.readUInt32LE(centralOffset + 16);
    const compressedSize = buffer.readUInt32LE(centralOffset + 20);
    const uncompressedSize = buffer.readUInt32LE(centralOffset + 24);
    const fileNameLength = buffer.readUInt16LE(centralOffset + 28);
    const extraLength = buffer.readUInt16LE(centralOffset + 30);
    const commentLength = buffer.readUInt16LE(centralOffset + 32);
    const localHeaderOffset = buffer.readUInt32LE(centralOffset + 42);
    const fileNameStart = centralOffset + 46;
    const fileName = buffer
      .subarray(fileNameStart, fileNameStart + fileNameLength)
      .toString('utf8');

    if (
      buffer.readUInt32LE(localHeaderOffset) !== LOCAL_FILE_HEADER_SIGNATURE
    ) {
      throw new Error(`Invalid ZIP local header for ${fileName}.`);
    }

    const localFileNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28);
    const dataStart =
      localHeaderOffset + 30 + localFileNameLength + localExtraLength;
    const compressed = buffer.subarray(dataStart, dataStart + compressedSize);

    let content;

    if (method === STORED_METHOD) {
      content = Buffer.from(compressed);
    } else if (method === DEFLATE_METHOD) {
      content = inflateRawSync(compressed);
    } else {
      throw new Error(
        `Unsupported ZIP compression method ${method} for ${fileName}.`
      );
    }

    if (content.length !== uncompressedSize) {
      throw new Error(`ZIP size mismatch for ${fileName}.`);
    }

    if (crc32(content) !== checksum) {
      throw new Error(`ZIP checksum mismatch for ${fileName}.`);
    }

    entries.push({
      name: normalizeArchivePath(fileName),
      content,
    });

    centralOffset += 46 + fileNameLength + extraLength + commentLength;
  }

  return entries;
}

//===================================================================

function collectArchiveViolations(buffer, archiveLabel, depth = 0) {
  if (depth > MAX_NESTED_ARCHIVE_DEPTH) {
    return [`nested archive depth exceeded: ${archiveLabel}`];
  }

  const violations = [];
  const entries = readZipEntriesFromBuffer(buffer);

  for (const entry of entries) {
    const entryLabel = `${archiveLabel}!/${entry.name}`;

    if (entry.name.startsWith('/') || entry.name.split('/').includes('..')) {
      violations.push(`unsafe archive path: ${entryLabel}`);
      continue;
    }

    if (hasForbiddenDirectory(entry.name)) {
      violations.push(`forbidden directory entry: ${entryLabel}`);
    }

    if (isExcludedFile(entry.name)) {
      violations.push(`forbidden file entry: ${entryLabel}`);
    }

    if (entry.name.toLowerCase().endsWith('.zip')) {
      try {
        violations.push(
          ...collectArchiveViolations(entry.content, entryLabel, depth + 1)
        );
      } catch (error) {
        violations.push(
          `invalid nested ZIP ${entryLabel}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
  }

  return violations;
}

//===================================================================

export async function verifySourceArchiveZip(
  archivePath,
  { requiredFiles = [] } = {}
) {
  const buffer = await readFile(archivePath);
  const entries = readZipEntriesFromBuffer(buffer);
  const entryNames = new Set(entries.map((entry) => entry.name));
  const violations = collectArchiveViolations(
    buffer,
    path.basename(archivePath)
  );

  for (const requiredFile of requiredFiles) {
    if (!entryNames.has(normalizeArchivePath(requiredFile))) {
      violations.push(`required source file is missing: ${requiredFile}`);
    }
  }

  if (violations.length > 0) {
    throw new Error(
      [
        'Final source ZIP hygiene check failed:',
        ...violations.map((item) => `- ${item}`),
      ].join('\n')
    );
  }

  return {
    entryCount: entries.length,
    archivePath,
  };
}
