export type FitMode = 'contain' | 'cover';
export type UpscaleMode = 'off' | 'balanced' | 'detail';
export type OutputFormat = 'jpeg' | 'png' | 'webp';
export type OrientationMode = 'fixed' | 'auto' | 'portrait' | 'landscape';

export type ImagePreset = {
  id: string;
  label: string;
  widthCm: number;
  heightCm: number;
};

export type EnhancementSettings = {
  brightness: number;
  contrast: number;
  saturation: number;
  sharpen: number;
  autoTone: boolean;
};

export type ResizeSettings = {
  presetId: string;
  widthCm: number;
  heightCm: number;
  dpi: number;
  fitMode: FitMode;
  upscaleMode: UpscaleMode;
  orientationMode: OrientationMode;
  outputFormat: OutputFormat;
  quality: number;
  background: string;
  enhancements: EnhancementSettings;
};

export type InputImage = {
  id: string;
  name: string;
  source: 'file' | 'zip';
  file: File;
  objectUrl: string;
  width: number;
  height: number;
  aspectRatio: number;
};

export type ProcessedImage = {
  id: string;
  name: string;
  blob: Blob;
  objectUrl: string;
  width: number;
  height: number;
  dpi: number;
  upscaleApplied: boolean;
  warning?: string;
  error?: string;
};

export type RowStatus = 'pending' | 'processing' | 'done' | 'error';

export type ImageRow = {
  input: InputImage;
  status: RowStatus;
  result?: ProcessedImage;
  error?: string;
};
