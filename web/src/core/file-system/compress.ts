import { inputToBlob } from '../export/blob';
import { ZipWriter } from '../export/zip';

interface CompressFile {
  filename: string;
  data: Blob | string;
}

export default async function compress(files: CompressFile[]): Promise<Blob> {
  const zip = new ZipWriter();

  for (const file of files) {
    zip.addFile({
      blob: await inputToBlob(file.data),
      filename: file.filename,
    });
  }

  return await zip.finalize();
}
