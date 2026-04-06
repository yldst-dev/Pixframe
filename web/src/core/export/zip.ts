import JSZip from 'jszip';

export class ZipWriter {
  private readonly zip = new JSZip();

  addFile(file: { blob: Blob; filename: string }): void {
    this.zip.file(file.filename, file.blob);
  }

  async finalize(): Promise<Blob> {
    return await this.zip.generateAsync({ type: 'blob' });
  }
}
