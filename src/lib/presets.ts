import type { ImagePreset, ResizeSettings } from '../types';

export const imagePresets: ImagePreset[] = [
  { id: '10x15', label: '10 x 15 cm', widthCm: 10, heightCm: 15 },
  { id: '13x18', label: '13 x 18 cm', widthCm: 13, heightCm: 18 },
  { id: '15x20', label: '15 x 20 cm', widthCm: 15, heightCm: 20 },
  { id: '20x25', label: '20 x 25 cm', widthCm: 20, heightCm: 25 },
  { id: '20x30', label: '20 x 30 cm', widthCm: 20, heightCm: 30 },
  { id: '30x40', label: '30 x 40 cm', widthCm: 30, heightCm: 40 },
  { id: 'a5', label: 'A5', widthCm: 14.8, heightCm: 21 },
  { id: 'a4', label: 'A4', widthCm: 21, heightCm: 29.7 },
  { id: 'a3', label: 'A3', widthCm: 29.7, heightCm: 42 },
];

export const defaultSettings: ResizeSettings = {
  presetId: imagePresets[0].id,
  widthCm: imagePresets[0].widthCm,
  heightCm: imagePresets[0].heightCm,
  dpi: 300,
  fitMode: 'contain',
  upscaleMode: 'balanced',
  orientationMode: 'fixed',
  outputFormat: 'jpeg',
  quality: 0.92,
  background: '#f6f0e8',
  enhancements: {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    sharpen: 0,
    autoTone: false,
  },
};

export const dpiOptions = [72, 96, 150, 300, 600];
