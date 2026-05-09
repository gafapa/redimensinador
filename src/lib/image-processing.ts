import pica from 'pica';
import type { InputImage, OutputFormat, ProcessedImage, ResizeSettings } from '../types';

const resizer = pica({ features: ['js', 'wasm', 'ww'] });
const centimetersPerInch = 2.54;

// Returns the effective target dimensions, potentially swapping width/height based on orientation mode.
export function getEffectiveTarget(settings: ResizeSettings, image: InputImage) {
  let { widthCm, heightCm } = settings;
  const { orientationMode } = settings;
  const imageIsLandscape = image.width > image.height;
  const targetIsLandscape = widthCm > heightCm;

  if (orientationMode === 'auto') {
    if (imageIsLandscape !== targetIsLandscape && widthCm !== heightCm) {
      [widthCm, heightCm] = [heightCm, widthCm];
    }
  } else if (orientationMode === 'portrait') {
    if (widthCm > heightCm) [widthCm, heightCm] = [heightCm, widthCm];
  } else if (orientationMode === 'landscape') {
    if (heightCm > widthCm) [widthCm, heightCm] = [heightCm, widthCm];
  }

  return {
    widthCm,
    heightCm,
    width: Math.max(1, Math.round((widthCm / centimetersPerInch) * settings.dpi)),
    height: Math.max(1, Math.round((heightCm / centimetersPerInch) * settings.dpi)),
  };
}

function needsRotation(image: InputImage, settings: ResizeSettings): boolean {
  const { orientationMode } = settings;
  if (orientationMode === 'auto') return false;
  const imageIsLandscape = image.width > image.height;
  return orientationMode === 'portrait' ? imageIsLandscape : !imageIsLandscape;
}

function rotateCanvas90(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const rotated = document.createElement('canvas');
  rotated.width = canvas.height;
  rotated.height = canvas.width;
  const ctx = rotated.getContext('2d');
  if (!ctx) return canvas;
  ctx.translate(rotated.width / 2, rotated.height / 2);
  ctx.rotate(Math.PI / 2);
  ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
  return rotated;
}

export async function readImageDimensions(file: File) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const bitmap = await createImageBitmap(file);
    const dimensions = {
      objectUrl,
      width: bitmap.width,
      height: bitmap.height,
    };
    bitmap.close();
    return dimensions;
  } catch {
    const image = await loadImage(objectUrl);
    return {
      objectUrl,
      width: image.naturalWidth,
      height: image.naturalHeight,
    };
  }
}

export function shouldUpscale(image: InputImage, settings: ResizeSettings) {
  const target = getEffectiveTarget(settings, image);
  const rotate = needsRotation(image, settings);
  const imgW = rotate ? image.height : image.width;
  const imgH = rotate ? image.width : image.height;
  const scaleX = target.width / imgW;
  const scaleY = target.height / imgH;
  return Math.min(scaleX, scaleY) > 1;
}

export async function processImage(image: InputImage, settings: ResizeSettings): Promise<ProcessedImage> {
  const effectiveTarget = getEffectiveTarget(settings, image);
  const source = await loadImage(image.objectUrl);
  let sourceCanvas = document.createElement('canvas');
  sourceCanvas.width = source.naturalWidth;
  sourceCanvas.height = source.naturalHeight;

  const sourceContext = sourceCanvas.getContext('2d');
  if (!sourceContext) {
    throw new Error('Canvas is not available in this browser.');
  }

  sourceContext.filter = buildCanvasFilter(settings);
  sourceContext.drawImage(source, 0, 0);

  if (settings.enhancements.autoTone) {
    applyAutoTone(sourceCanvas);
  }

  if (settings.enhancements.sharpen > 0) {
    applySharpen(sourceCanvas, settings.enhancements.sharpen);
  }

  if (needsRotation(image, settings)) {
    const rotated = rotateCanvas90(sourceCanvas);
    sourceCanvas.width = 0;
    sourceCanvas.height = 0;
    sourceCanvas = rotated;
  }

  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = effectiveTarget.width;
  outputCanvas.height = effectiveTarget.height;

  const outputContext = outputCanvas.getContext('2d');
  if (!outputContext) {
    throw new Error('Canvas context could not be created.');
  }

  outputContext.fillStyle = settings.background;
  outputContext.fillRect(0, 0, outputCanvas.width, outputCanvas.height);

  const { drawWidth, drawHeight, offsetX, offsetY, upscaleApplied } = computePlacement(
    { width: sourceCanvas.width, height: sourceCanvas.height },
    effectiveTarget,
    settings,
  );

  if (drawWidth === sourceCanvas.width && drawHeight === sourceCanvas.height && offsetX === 0 && offsetY === 0) {
    outputContext.drawImage(sourceCanvas, 0, 0);
  } else {
    const resizedCanvas = document.createElement('canvas');
    resizedCanvas.width = Math.max(1, Math.round(drawWidth));
    resizedCanvas.height = Math.max(1, Math.round(drawHeight));

    const isUpscaling = drawWidth > sourceCanvas.width || drawHeight > sourceCanvas.height;
    await resizer.resize(sourceCanvas, resizedCanvas, {
      quality: isUpscaling && settings.upscaleMode === 'detail' ? 3 : 2,
      unsharpAmount: isUpscaling && settings.upscaleMode === 'detail' ? 120 : 80,
      unsharpRadius: 0.6,
      unsharpThreshold: 2,
    });

    outputContext.drawImage(resizedCanvas, Math.round(offsetX), Math.round(offsetY));
    resizedCanvas.width = 0;
    resizedCanvas.height = 0;
  }

  const blob = await canvasToBlob(outputCanvas, settings.outputFormat, settings.quality);

  sourceCanvas.width = 0;
  sourceCanvas.height = 0;
  outputCanvas.width = 0;
  outputCanvas.height = 0;

  const extension = formatToExtension(settings.outputFormat);
  const safeName = image.name.replace(/\.[^.]+$/, '');

  return {
    id: image.id,
    name: `${safeName}_${formatCentimeters(effectiveTarget.widthCm)}x${formatCentimeters(effectiveTarget.heightCm)}cm_${settings.dpi}dpi.${extension}`,
    blob,
    objectUrl: URL.createObjectURL(blob),
    width: effectiveTarget.width,
    height: effectiveTarget.height,
    dpi: settings.dpi,
    upscaleApplied,
    warning: upscaleApplied ? undefined : shouldUpscale(image, settings) ? 'upscaleNeeded' : undefined,
  };
}

function computePlacement(
  imageDims: { width: number; height: number },
  target: { width: number; height: number },
  settings: ResizeSettings,
) {
  const widthRatio = target.width / imageDims.width;
  const heightRatio = target.height / imageDims.height;
  const fitRatio = settings.fitMode === 'cover' ? Math.max(widthRatio, heightRatio) : Math.min(widthRatio, heightRatio);
  const upscaleAllowed = settings.upscaleMode !== 'off';
  const ratio = upscaleAllowed ? fitRatio : Math.min(fitRatio, 1);
  const drawWidth = imageDims.width * ratio;
  const drawHeight = imageDims.height * ratio;

  return {
    drawWidth,
    drawHeight,
    offsetX: (target.width - drawWidth) / 2,
    offsetY: (target.height - drawHeight) / 2,
    upscaleApplied: ratio > 1,
  };
}

export function getTargetPixels(settings: ResizeSettings) {
  return {
    width: Math.max(1, Math.round((settings.widthCm / centimetersPerInch) * settings.dpi)),
    height: Math.max(1, Math.round((settings.heightCm / centimetersPerInch) * settings.dpi)),
  };
}

export function formatCentimeters(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function buildCanvasFilter(settings: ResizeSettings) {
  return [
    `brightness(${settings.enhancements.brightness}%)`,
    `contrast(${settings.enhancements.contrast}%)`,
    `saturate(${settings.enhancements.saturation}%)`,
  ].join(' ');
}

function applyAutoTone(canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d');
  if (!context) {
    return;
  }

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imageData;

  let min = 255;
  let max = 0;

  for (let index = 0; index < data.length; index += 4) {
    const luma = 0.2126 * data[index] + 0.7152 * data[index + 1] + 0.0722 * data[index + 2];
    min = Math.min(min, luma);
    max = Math.max(max, luma);
  }

  const range = Math.max(1, max - min);
  for (let index = 0; index < data.length; index += 4) {
    data[index] = clamp(((data[index] - min) / range) * 255);
    data[index + 1] = clamp(((data[index + 1] - min) / range) * 255);
    data[index + 2] = clamp(((data[index + 2] - min) / range) * 255);
  }

  context.putImageData(imageData, 0, 0);
}

function applySharpen(canvas: HTMLCanvasElement, strength: number) {
  const context = canvas.getContext('2d');
  if (!context) {
    return;
  }

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const { data, width, height } = imageData;
  const copy = new Uint8ClampedArray(data);
  const amount = strength / 100;

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = (y * width + x) * 4;
      for (let channel = 0; channel < 3; channel += 1) {
        const center = copy[index + channel] * (1 + 4 * amount);
        const top = copy[index - width * 4 + channel] * amount;
        const bottom = copy[index + width * 4 + channel] * amount;
        const left = copy[index - 4 + channel] * amount;
        const right = copy[index + 4 + channel] * amount;
        data[index + channel] = clamp(center - top - bottom - left - right);
      }
    }
  }

  context.putImageData(imageData, 0, 0);
}

function clamp(value: number) {
  return Math.max(0, Math.min(255, value));
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load image: ${src}`));
    image.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, format: OutputFormat, quality: number) {
  const mimeType = formatToMimeType(format);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Export failed.'));
        return;
      }
      resolve(blob);
    }, mimeType, quality);
  });
}

function formatToMimeType(format: OutputFormat) {
  if (format === 'png') {
    return 'image/png';
  }
  if (format === 'webp') {
    return 'image/webp';
  }
  return 'image/jpeg';
}

function formatToExtension(format: OutputFormat) {
  if (format === 'png') {
    return 'png';
  }
  if (format === 'webp') {
    return 'webp';
  }
  return 'jpg';
}
