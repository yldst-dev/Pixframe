import { ExportFormat } from './types';

export interface ExportExifMetadata {
  exposureTime?: string;
  fNumber?: string;
  focalLength?: string;
  iso?: string;
  lensModel?: string;
  make?: string;
  model?: string;
  takenAt?: string;
}

interface TiffEntry {
  count: number;
  data: Uint8Array;
  tag: number;
  type: number;
}

const EXIF_PREFIX = new Uint8Array([0x45, 0x78, 0x69, 0x66, 0x00, 0x00]);
const PNG_SIGNATURE = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const PNG_EXIF_CHUNK = new Uint8Array([0x65, 0x58, 0x49, 0x66]);
const CRC_TABLE = new Uint32Array(256).map((_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = (value & 1) !== 0 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

const concatBytes = (parts: Uint8Array[]): Uint8Array => {
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
};

const startsWith = (bytes: Uint8Array, offset: number, prefix: Uint8Array): boolean => {
  if (offset + prefix.length > bytes.length) {
    return false;
  }
  for (let index = 0; index < prefix.length; index += 1) {
    if (bytes[offset + index] !== prefix[index]) {
      return false;
    }
  }
  return true;
};

const readUint16BE = (bytes: Uint8Array, offset: number): number => (bytes[offset] << 8) | bytes[offset + 1];

const writeUint16BE = (bytes: Uint8Array, offset: number, value: number): void => {
  bytes[offset] = (value >>> 8) & 0xff;
  bytes[offset + 1] = value & 0xff;
};

const readUint32BE = (bytes: Uint8Array, offset: number): number =>
  ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0;

const writeUint32BE = (bytes: Uint8Array, offset: number, value: number): void => {
  bytes[offset] = (value >>> 24) & 0xff;
  bytes[offset + 1] = (value >>> 16) & 0xff;
  bytes[offset + 2] = (value >>> 8) & 0xff;
  bytes[offset + 3] = value & 0xff;
};

const writeUint16LE = (bytes: Uint8Array, offset: number, value: number): void => {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >>> 8) & 0xff;
};

const writeUint32LE = (bytes: Uint8Array, offset: number, value: number): void => {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >>> 8) & 0xff;
  bytes[offset + 2] = (value >>> 16) & 0xff;
  bytes[offset + 3] = (value >>> 24) & 0xff;
};

const isJpeg = (bytes: Uint8Array): boolean => bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xd8;

const isPng = (bytes: Uint8Array): boolean => startsWith(bytes, 0, PNG_SIGNATURE);

const getPngChunkType = (bytes: Uint8Array, offset: number): string =>
  String.fromCharCode(bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7]);

const isStandaloneJpegMarker = (marker: number): boolean => marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7);

const isExifPayload = (bytes: Uint8Array, offset: number): boolean => startsWith(bytes, offset, EXIF_PREFIX);

const extractJpegExifPayload = (bytes: Uint8Array): Uint8Array | null => {
  if (!isJpeg(bytes)) {
    return null;
  }

  let offset = 2;
  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) {
      return null;
    }

    const marker = bytes[offset + 1];
    if (marker === 0xda || marker === 0xd9) {
      return null;
    }

    if (isStandaloneJpegMarker(marker)) {
      offset += 2;
      continue;
    }

    const length = readUint16BE(bytes, offset + 2);
    const segmentEnd = offset + 2 + length;
    const payloadOffset = offset + 4;
    if (length < 2 || segmentEnd > bytes.length) {
      return null;
    }

    if (marker === 0xe1 && isExifPayload(bytes, payloadOffset)) {
      return bytes.slice(payloadOffset, segmentEnd);
    }

    offset = segmentEnd;
  }

  return null;
};

const extractPngExifPayload = (bytes: Uint8Array): Uint8Array | null => {
  if (!isPng(bytes)) {
    return null;
  }

  let offset = PNG_SIGNATURE.length;
  while (offset + 12 <= bytes.length) {
    const length = readUint32BE(bytes, offset);
    const chunkEnd = offset + 12 + length;
    if (chunkEnd > bytes.length) {
      return null;
    }

    if (getPngChunkType(bytes, offset) === 'eXIf') {
      return concatBytes([EXIF_PREFIX, bytes.slice(offset + 8, offset + 8 + length)]);
    }

    offset = chunkEnd;
  }

  return null;
};

const readExifPayload = async (sourceFile: File): Promise<Uint8Array | null> => {
  const bytes = new Uint8Array(await sourceFile.arrayBuffer());
  return extractJpegExifPayload(bytes) ?? extractPngExifPayload(bytes);
};

const textEncoder = new TextEncoder();

const asciiValue = (value: string | undefined): Uint8Array | null => {
  const normalized = value?.trim();
  return normalized ? textEncoder.encode(`${normalized}\0`) : null;
};

const shortValue = (value: number): Uint8Array => {
  const bytes = new Uint8Array(2);
  writeUint16LE(bytes, 0, value);
  return bytes;
};

const longValue = (value: number): Uint8Array => {
  const bytes = new Uint8Array(4);
  writeUint32LE(bytes, 0, value);
  return bytes;
};

const gcd = (left: number, right: number): number => {
  let a = Math.abs(left);
  let b = Math.abs(right);
  while (b !== 0) {
    const remainder = a % b;
    a = b;
    b = remainder;
  }
  return a || 1;
};

const decimalToRational = (value: number, scale: number): [number, number] | null => {
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }

  const denominator = scale;
  const numerator = Math.round(value * denominator);
  const divisor = gcd(numerator, denominator);
  return [Math.max(1, Math.round(numerator / divisor)), Math.max(1, Math.round(denominator / divisor))];
};

const rationalValue = (numerator: number, denominator: number): Uint8Array => {
  const bytes = new Uint8Array(8);
  writeUint32LE(bytes, 0, numerator);
  writeUint32LE(bytes, 4, denominator);
  return bytes;
};

const rationalFromDecimal = (value: number, scale: number): Uint8Array | null => {
  const rational = decimalToRational(value, scale);
  return rational ? rationalValue(rational[0], rational[1]) : null;
};

const parseNumber = (value: string | undefined): number | null => {
  const match = value?.match(/[\d.]+/);
  if (!match) {
    return null;
  }

  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseIso = (value: string | undefined): number | null => {
  const match = value?.match(/\d+/);
  if (!match) {
    return null;
  }

  const parsed = Number(match[0]);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const parseExposure = (value: string | undefined): Uint8Array | null => {
  const normalized = value?.replace(/s$/i, '').trim();
  if (!normalized) {
    return null;
  }

  const fraction = normalized.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
  if (fraction) {
    const numerator = Number(fraction[1]);
    const denominator = Number(fraction[2]);
    if (Number.isFinite(numerator) && Number.isFinite(denominator) && numerator > 0 && denominator > 0) {
      return rationalFromDecimal(numerator / denominator, 1000000);
    }
  }

  const decimal = Number(normalized);
  return rationalFromDecimal(decimal, 1000000);
};

const dateTimeOriginalValue = (value: string | undefined): Uint8Array | null => {
  const normalized = value?.trim().replace(/^(\d{4})-(\d{2})-(\d{2})/, '$1:$2:$3');
  return asciiValue(normalized);
};

const makeEntry = (tag: number, type: number, count: number, data: Uint8Array | null): TiffEntry | null =>
  data ? { tag, type, count, data } : null;

const measureIfdLength = (entries: TiffEntry[]): number => 2 + entries.length * 12 + 4 + entries.reduce((sum, entry) => sum + (entry.data.length > 4 ? entry.data.length : 0), 0);

const buildIfd = (entries: TiffEntry[], startOffset: number): Uint8Array => {
  const headerLength = 2 + entries.length * 12 + 4;
  const header = new Uint8Array(headerLength);
  const values: Uint8Array[] = [];
  let valueOffset = startOffset + headerLength;

  writeUint16LE(header, 0, entries.length);
  entries.forEach((entry, index) => {
    const entryOffset = 2 + index * 12;
    writeUint16LE(header, entryOffset, entry.tag);
    writeUint16LE(header, entryOffset + 2, entry.type);
    writeUint32LE(header, entryOffset + 4, entry.count);

    if (entry.data.length <= 4) {
      header.set(entry.data, entryOffset + 8);
    } else {
      writeUint32LE(header, entryOffset + 8, valueOffset);
      values.push(entry.data);
      valueOffset += entry.data.length;
    }
  });

  return concatBytes([header, ...values]);
};

const createExifPayloadFromMetadata = (metadata?: ExportExifMetadata): Uint8Array | null => {
  if (!metadata) {
    return null;
  }

  const make = asciiValue(metadata.make);
  const model = asciiValue(metadata.model);
  const lensModel = asciiValue(metadata.lensModel);
  const dateTimeOriginal = dateTimeOriginalValue(metadata.takenAt);
  const iso = parseIso(metadata.iso);
  const fNumber = parseNumber(metadata.fNumber);
  const focalLength = parseNumber(metadata.focalLength);
  const exposureTime = parseExposure(metadata.exposureTime);

  const exifEntries = [
    makeEntry(0x829a, 5, 1, exposureTime),
    makeEntry(0x829d, 5, 1, fNumber ? rationalFromDecimal(fNumber, 100) : null),
    makeEntry(0x8827, 3, 1, iso ? shortValue(iso) : null),
    makeEntry(0x9003, 2, dateTimeOriginal?.length ?? 0, dateTimeOriginal),
    makeEntry(0x920a, 5, 1, focalLength ? rationalFromDecimal(focalLength, 100) : null),
    makeEntry(0xa434, 2, lensModel?.length ?? 0, lensModel),
  ].filter((entry): entry is TiffEntry => Boolean(entry));

  const baseIfd0Entries = [
    makeEntry(0x010f, 2, make?.length ?? 0, make),
    makeEntry(0x0110, 2, model?.length ?? 0, model),
    makeEntry(0x0112, 3, 1, shortValue(1)),
  ].filter((entry): entry is TiffEntry => Boolean(entry));

  if (baseIfd0Entries.length === 1 && exifEntries.length === 0) {
    return null;
  }

  const tiffHeader = new Uint8Array([0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00]);
  const ifd0Entries = [...baseIfd0Entries];
  if (exifEntries.length > 0) {
    const exifIfdOffset = tiffHeader.length + measureIfdLength([...ifd0Entries, { tag: 0x8769, type: 4, count: 1, data: longValue(0) }]);
    ifd0Entries.push({ tag: 0x8769, type: 4, count: 1, data: longValue(exifIfdOffset) });
    const ifd0 = buildIfd(ifd0Entries, tiffHeader.length);
    const exifIfd = buildIfd(exifEntries, exifIfdOffset);
    return concatBytes([EXIF_PREFIX, tiffHeader, ifd0, exifIfd]);
  }

  return concatBytes([EXIF_PREFIX, tiffHeader, buildIfd(ifd0Entries, tiffHeader.length)]);
};

const hasExifPrefix = (payload: Uint8Array): boolean => startsWith(payload, 0, EXIF_PREFIX);

const readExifUint16 = (bytes: Uint8Array, offset: number, littleEndian: boolean): number =>
  littleEndian ? bytes[offset] | (bytes[offset + 1] << 8) : (bytes[offset] << 8) | bytes[offset + 1];

const readExifUint32 = (bytes: Uint8Array, offset: number, littleEndian: boolean): number =>
  littleEndian
    ? ((bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0)
    : readUint32BE(bytes, offset);

const writeExifShortValue = (bytes: Uint8Array, offset: number, value: number, littleEndian: boolean): void => {
  if (littleEndian) {
    bytes[offset] = value & 0xff;
    bytes[offset + 1] = (value >>> 8) & 0xff;
    return;
  }
  bytes[offset] = (value >>> 8) & 0xff;
  bytes[offset + 1] = value & 0xff;
};

const normalizeExifOrientation = (payload: Uint8Array): Uint8Array => {
  const normalized = payload.slice();
  const tiffOffset = hasExifPrefix(normalized) ? EXIF_PREFIX.length : 0;
  if (normalized.length < tiffOffset + 8) {
    return normalized;
  }

  const littleEndian = normalized[tiffOffset] === 0x49 && normalized[tiffOffset + 1] === 0x49;
  const bigEndian = normalized[tiffOffset] === 0x4d && normalized[tiffOffset + 1] === 0x4d;
  if (!littleEndian && !bigEndian) {
    return normalized;
  }

  if (readExifUint16(normalized, tiffOffset + 2, littleEndian) !== 42) {
    return normalized;
  }

  const ifdOffset = tiffOffset + readExifUint32(normalized, tiffOffset + 4, littleEndian);
  if (ifdOffset + 2 > normalized.length) {
    return normalized;
  }

  const entryCount = readExifUint16(normalized, ifdOffset, littleEndian);
  for (let index = 0; index < entryCount; index += 1) {
    const entryOffset = ifdOffset + 2 + index * 12;
    if (entryOffset + 12 > normalized.length) {
      return normalized;
    }

    const tag = readExifUint16(normalized, entryOffset, littleEndian);
    const type = readExifUint16(normalized, entryOffset + 2, littleEndian);
    const count = readExifUint32(normalized, entryOffset + 4, littleEndian);
    if (tag === 0x0112 && type === 3 && count >= 1) {
      writeExifShortValue(normalized, entryOffset + 8, 1, littleEndian);
      return normalized;
    }
  }

  return normalized;
};

const removeJpegExifSegments = (bytes: Uint8Array): Uint8Array => {
  if (!isJpeg(bytes)) {
    return bytes;
  }

  const parts: Uint8Array[] = [bytes.slice(0, 2)];
  let offset = 2;
  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) {
      break;
    }

    const marker = bytes[offset + 1];
    if (marker === 0xda || marker === 0xd9) {
      break;
    }

    if (isStandaloneJpegMarker(marker)) {
      parts.push(bytes.slice(offset, offset + 2));
      offset += 2;
      continue;
    }

    const length = readUint16BE(bytes, offset + 2);
    const segmentEnd = offset + 2 + length;
    const payloadOffset = offset + 4;
    if (length < 2 || segmentEnd > bytes.length) {
      return bytes;
    }

    if (!(marker === 0xe1 && isExifPayload(bytes, payloadOffset))) {
      parts.push(bytes.slice(offset, segmentEnd));
    }

    offset = segmentEnd;
  }

  parts.push(bytes.slice(offset));
  return concatBytes(parts);
};

const findJpegExifInsertOffset = (bytes: Uint8Array): number => {
  let offset = 2;
  while (offset + 4 <= bytes.length && bytes[offset] === 0xff && bytes[offset + 1] === 0xe0) {
    const length = readUint16BE(bytes, offset + 2);
    const segmentEnd = offset + 2 + length;
    if (length < 2 || segmentEnd > bytes.length) {
      return 2;
    }
    offset = segmentEnd;
  }
  return offset;
};

const createJpegExifSegment = (payload: Uint8Array): Uint8Array | null => {
  const length = payload.length + 2;
  if (length > 0xffff) {
    return null;
  }

  const segment = new Uint8Array(payload.length + 4);
  segment[0] = 0xff;
  segment[1] = 0xe1;
  writeUint16BE(segment, 2, length);
  segment.set(payload, 4);
  return segment;
};

const insertJpegExif = (blobBytes: Uint8Array, payload: Uint8Array): Uint8Array => {
  const cleanBytes = removeJpegExifSegments(blobBytes);
  const segment = createJpegExifSegment(payload);
  if (!segment) {
    return blobBytes;
  }

  const insertOffset = findJpegExifInsertOffset(cleanBytes);
  return concatBytes([cleanBytes.slice(0, insertOffset), segment, cleanBytes.slice(insertOffset)]);
};

const crc32 = (bytes: Uint8Array): number => {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const createPngChunk = (type: Uint8Array, data: Uint8Array): Uint8Array => {
  const chunk = new Uint8Array(12 + data.length);
  writeUint32BE(chunk, 0, data.length);
  chunk.set(type, 4);
  chunk.set(data, 8);
  writeUint32BE(chunk, 8 + data.length, crc32(chunk.slice(4, 8 + data.length)));
  return chunk;
};

const pngExifDataFromPayload = (payload: Uint8Array): Uint8Array => (hasExifPrefix(payload) ? payload.slice(EXIF_PREFIX.length) : payload);

const insertPngExif = (blobBytes: Uint8Array, payload: Uint8Array): Uint8Array => {
  if (!isPng(blobBytes)) {
    return blobBytes;
  }

  const exifChunk = createPngChunk(PNG_EXIF_CHUNK, pngExifDataFromPayload(payload));
  const parts: Uint8Array[] = [blobBytes.slice(0, PNG_SIGNATURE.length)];
  let offset = PNG_SIGNATURE.length;
  let inserted = false;

  while (offset + 12 <= blobBytes.length) {
    const length = readUint32BE(blobBytes, offset);
    const chunkEnd = offset + 12 + length;
    if (chunkEnd > blobBytes.length) {
      return blobBytes;
    }

    const type = getPngChunkType(blobBytes, offset);
    if (type !== 'eXIf') {
      parts.push(blobBytes.slice(offset, chunkEnd));
    }

    if (type === 'IHDR' && !inserted) {
      parts.push(exifChunk);
      inserted = true;
    }

    offset = chunkEnd;
  }

  if (!inserted) {
    return blobBytes;
  }

  return concatBytes(parts);
};

export const applyExifMetadata = async (blob: Blob, sourceFile: File, format: ExportFormat, maintainExif: boolean, fallbackMetadata?: ExportExifMetadata): Promise<Blob> => {
  if (!maintainExif) {
    return blob;
  }

  const exifPayload = (await readExifPayload(sourceFile)) ?? createExifPayloadFromMetadata(fallbackMetadata);
  if (!exifPayload) {
    return blob;
  }

  const normalizedPayload = normalizeExifOrientation(exifPayload);
  const blobBytes = new Uint8Array(await blob.arrayBuffer());
  const outputBytes = format.useJpeg ? insertJpegExif(blobBytes, normalizedPayload) : insertPngExif(blobBytes, normalizedPayload);
  const outputBuffer = new ArrayBuffer(outputBytes.byteLength);
  new Uint8Array(outputBuffer).set(outputBytes);
  return new Blob([outputBuffer], { type: format.mimeType });
};
