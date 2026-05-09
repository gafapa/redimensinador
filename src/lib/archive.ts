import JSZip from 'jszip';
import type { ProcessedImage } from '../types';

const imagePattern = /\.(png|jpe?g|webp|bmp)$/i;
const pdfPattern = /\.pdf$/i;
const archivePattern = /\.(png|jpe?g|webp|bmp|pdf)$/i;
const pdfSupportAssetPaths = {
  cMapUrl: 'pdfjs/cmaps/',
  iccUrl: 'pdfjs/iccs/',
  standardFontDataUrl: 'pdfjs/standard_fonts/',
  wasmUrl: 'pdfjs/wasm/',
} as const;
let pdfJsPromise: Promise<typeof import('pdfjs-dist')> | null = null;
let pdfWorkerUrlPromise: Promise<string> | null = null;

export function isZipFile(file: File) {
  return /\.zip$/i.test(file.name) || file.type === 'application/zip' || file.type === 'application/x-zip-compressed';
}

export function isImageFile(file: File) {
  return file.type.startsWith('image/') || imagePattern.test(file.name);
}

export function isPdfFile(file: File) {
  return file.type === 'application/pdf' || pdfPattern.test(file.name);
}

export async function extractAcceptedFilesFromZip(file: File) {
  const zip = await JSZip.loadAsync(file);
  const entries = Object.values(zip.files).filter((entry) => !entry.dir && archivePattern.test(entry.name));
  const extractedFiles = await Promise.all(
    entries.map(async (entry) => {
      const filename = entry.name.split('/').pop() || 'file';

      if (pdfPattern.test(filename)) {
        const content = await entry.async('uint8array');
        return renderPdfPagesToFiles(content, filename);
      }

      const content = await entry.async('blob');
      const type = content.type || inferMimeType(filename);
      return [new File([content], filename, { type })];
    }),
  );

  return extractedFiles.flat();
}

export async function extractImagesFromPdf(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  return renderPdfPagesToFiles(bytes, file.name);
}

export async function buildZipBundle(images: ProcessedImage[]) {
  const zip = new JSZip();
  images.forEach((image) => {
    zip.file(image.name, image.blob);
  });
  return zip.generateAsync({ type: 'blob' });
}

async function renderPdfPagesToFiles(data: Uint8Array, filename: string) {
  const { getDocument } = await getPdfJs();
  const pdf = await getDocument({
    data,
    cMapUrl: getPdfSupportAssetUrl(pdfSupportAssetPaths.cMapUrl),
    cMapPacked: true,
    iccUrl: getPdfSupportAssetUrl(pdfSupportAssetPaths.iccUrl),
    standardFontDataUrl: getPdfSupportAssetUrl(pdfSupportAssetPaths.standardFontDataUrl),
    wasmUrl: getPdfSupportAssetUrl(pdfSupportAssetPaths.wasmUrl),
    useWorkerFetch: true,
  }).promise;
  const files: File[] = [];
  const totalPages = pdf.numPages;

  try {
    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);

      const context = canvas.getContext('2d', { alpha: false });
      if (!context) {
        canvas.width = 0;
        canvas.height = 0;
        throw new Error('Canvas context could not be created for PDF rendering.');
      }

      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({ canvas, canvasContext: context, viewport }).promise;

      const blob = await canvasToBlob(canvas);
      files.push(
        new File([blob], buildPdfPageName(filename, pageNumber, totalPages), {
          type: 'image/png',
        }),
      );

      page.cleanup();
      canvas.width = 0;
      canvas.height = 0;
    }
  } finally {
    await pdf.destroy();
  }

  return files;
}

async function getPdfJs() {
  if (!pdfJsPromise) {
    pdfJsPromise = Promise.all([import('pdfjs-dist'), getPdfWorkerUrl()]).then(([pdfJs, workerUrl]) => {
      pdfJs.GlobalWorkerOptions.workerSrc = workerUrl;
      return pdfJs;
    });
  }

  return pdfJsPromise;
}

async function getPdfWorkerUrl() {
  if (!pdfWorkerUrlPromise) {
    pdfWorkerUrlPromise = import('pdfjs-dist/build/pdf.worker.min.mjs?raw').then(({ default: workerSource }) =>
      URL.createObjectURL(new Blob([workerSource], { type: 'text/javascript' })),
    );
  }

  return pdfWorkerUrlPromise;
}

function getPdfSupportAssetUrl(path: string) {
  const appBaseUrl = new URL(import.meta.env.BASE_URL, window.location.origin);
  return new URL(path, appBaseUrl).toString();
}

function buildPdfPageName(filename: string, pageNumber: number, totalPages: number) {
  const baseName = filename.replace(/\.[^.]+$/, '');
  const digits = Math.max(2, String(totalPages).length);
  return `${baseName}_page_${String(pageNumber).padStart(digits, '0')}.png`;
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('PDF page export failed.'));
        return;
      }

      resolve(blob);
    }, 'image/png');
  });
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
