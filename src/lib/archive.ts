import JSZip from 'jszip';
import type { ProcessedImage } from '../types';

const imagePattern = /\.(png|jpe?g|webp|bmp)$/i;

export function isZipFile(file: File) {
  return /\.zip$/i.test(file.name) || file.type === 'application/zip' || file.type === 'application/x-zip-compressed';
}

export function isImageFile(file: File) {
  return file.type.startsWith('image/') || imagePattern.test(file.name);
}

export async function extractImagesFromZip(file: File) {
  const zip = await JSZip.loadAsync(file);
  const imageFiles = Object.values(zip.files).filter((entry) => !entry.dir && imagePattern.test(entry.name));

  return Promise.all(
    imageFiles.map(async (entry) => {
      const content = await entry.async('blob');
      const filename = entry.name.split('/').pop() || 'image';
      const type = content.type || inferMimeType(filename);
      return new File([content], filename, { type });
    }),
  );
}

export async function buildZipBundle(images: ProcessedImage[]) {
  const zip = new JSZip();
  images.forEach((image) => {
    zip.file(image.name, image.blob);
  });
  return zip.generateAsync({ type: 'blob' });
}

function inferMimeType(filename: string) {
  if (/\.png$/i.test(filename)) {
    return 'image/png';
  }
  if (/\.webp$/i.test(filename)) {
    return 'image/webp';
  }
  if (/\.bmp$/i.test(filename)) {
    return 'image/bmp';
  }
  return 'image/jpeg';
}
