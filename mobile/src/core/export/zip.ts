import JSZip from 'jszip';

export class ZipWriter {
  private readonly zip = new JSZip();

  addFile(file: { blob: Blob; filename: string }): void {
    const now = new Date();
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    this.zip.file(file.filename, file.blob, { date: localDate });
  }

  async finalize(): Promise<Blob> {
    return await this.zip.generateAsync({ type: 'blob' });
  }
}
