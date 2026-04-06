# Export Pipeline

## Goals

- Keep PNG export lossless
- Process files sequentially
- Release canvas and object URLs immediately after use
- Keep the WebAssembly boundary limited to PNG encoding
- Keep platform-specific save logic outside the export core

## Module Layout

- `web/src/core/export/*`
- `mobile/src/core/export/*`

### Core

- `format.ts`
  - Resolves export MIME type, extension, and JPEG quality
- `encode.ts`
  - Uses `@jsquash/png` for PNG encoding
  - Uses native `canvas.toBlob()` for JPEG encoding
- `theme-options.ts`
  - Merges theme defaults with current overrides
- `sequential-photo-export.ts`
  - Renders, encodes, and yields one file at a time
- `zip.ts`
  - Accepts binary blobs and creates ZIP output
- `blob.ts`
  - Converts between `Blob`, object URL, and native-only data URL boundaries

### Platform Adapters

- `core/file-system/download.ts`
  - Accepts `Blob | string`
  - Converts to data URL only for native gallery save paths
- `core/file-system/compress.ts`
  - Accepts `Blob | string`
  - Normalizes inputs to `Blob` and writes ZIP output as `Blob`

## Contracts

### Export Encoder

- Input
  - `HTMLCanvasElement`
  - `ExportFormat`
  - `quality: number`
- Output
  - `Promise<Blob>`

### Sequential Export

- Input
  - `photos`
  - `store`
  - `themeFunc`
  - `themeName`
  - `themeOptions`
  - optional `onProgress`
- Output
  - `AsyncGenerator<{ filename: string; blob: Blob; mimeType: 'image/png' | 'image/jpeg' }>`

### Download Adapter

- Input
  - `filename`
  - `Blob | string`
- Behavior
  - Web: save with `file-saver`
  - Native: convert `Blob` to data URL only at save time

## Processing Rules

1. Build theme options once per export action.
2. Render one photo.
3. Encode one blob.
4. Save or append to ZIP immediately.
5. Free the canvas in the same iteration.
6. Revoke object URLs when cache entries are replaced or evicted.

## Test Strategy

- Type contract check
  - `npx tsc -p web/tsconfig.json --noEmit`
  - `npx tsc -p mobile/tsconfig.json --noEmit`
- Lint
  - `npm run lint` in both apps
- Build
  - `npm run build` in both apps
- Security
  - `npm audit --omit=dev` in both apps
