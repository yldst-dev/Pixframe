import { describe, expect, it, vi } from 'vitest';
import { FileInputLike, ImageFilePickerDeps, openImageFilePicker } from '../src/utils/image-file-picker';

const createFileList = (files: File[]): FileList => {
  const fileList: Partial<FileList> & { [index: number]: File } = {
    length: files.length,
    item: (index: number) => files[index] ?? null,
  };
  files.forEach((file, index) => {
    fileList[index] = file;
  });
  return fileList as FileList;
};

const createDeps = () => {
  const input: FileInputLike = {
    type: '',
    accept: '',
    multiple: false,
    onchange: null,
    click: vi.fn(),
    remove: vi.fn(),
  };
  const appendInput = vi.fn();
  const removeInput = vi.fn((node: FileInputLike) => {
    node.remove();
  });
  const deps: ImageFilePickerDeps = {
    createInput: () => input,
    appendInput,
    removeInput,
  };
  return { input, appendInput, removeInput, deps };
};

describe('openImageFilePicker', () => {
  it('appends input before click', async () => {
    const { input, appendInput, deps } = createDeps();

    input.click = vi.fn(() => {
      expect(appendInput).toHaveBeenCalledWith(input);
      input.onchange?.({ target: { files: createFileList([]) } });
    });

    await openImageFilePicker(deps);
  });

  it('sets default attributes', async () => {
    const { input, deps } = createDeps();

    input.click = vi.fn(() => {
      input.onchange?.({ target: { files: createFileList([]) } });
    });

    await openImageFilePicker(deps);

    expect(input.type).toBe('file');
    expect(input.accept).toBe('image/*,.heic,.heif');
    expect(input.multiple).toBe(true);
  });

  it('returns selected files and removes input after change', async () => {
    const { input, removeInput, deps } = createDeps();
    const fileA = { name: 'a.jpg' } as File;
    const fileB = { name: 'b.heic' } as File;

    input.click = vi.fn(() => {
      input.onchange?.({ target: { files: createFileList([fileA, fileB]) } });
    });

    const files = await openImageFilePicker(deps);

    expect(files).toEqual([fileA, fileB]);
    expect(removeInput).toHaveBeenCalledWith(input);
  });
});
