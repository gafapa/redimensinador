import type { ImagePreset, ResizeSettings } from '../types';

export const imagePresets: ImagePreset[] = [
  { id: 'instagram-square', label: 'Instagram Square', width: 1080, height: 1080, category: 'social' },
  { id: 'instagram-story', label: 'Instagram Story', width: 1080, height: 1920, category: 'social' },
  { id: 'facebook-post', label: 'Facebook Post', width: 1200, height: 630, category: 'social' },
  { id: 'youtube-thumb', label: 'YouTube Thumbnail', width: 1280, height: 720, category: 'social' },
  { id: 'hd-landscape', label: 'HD Landscape', width: 1920, height: 1080, category: 'web' },
  { id: '4k-landscape', label: '4K Landscape', width: 3840, height: 2160, category: 'web' },
  { id: 'shop-card', label: 'Shop Card', width: 1600, height: 1600, category: 'web' },
  { id: 'a4-print', label: 'A4 Print 300 DPI', width: 2480, height: 3508, category: 'print' },
  { id: 'a3-print', label: 'A3 Print 300 DPI', width: 3508, height: 4961, category: 'print' },
];

export const defaultSettings: ResizeSettings = {
  presetId: imagePresets[0].id,
  width: imagePresets[0].width,
  height: imagePresets[0].height,
  dpi: 300,
  fitMode: 'contain',
  upscaleMode: 'off',
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
