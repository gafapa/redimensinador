# Architecture

## Overview

The application is a single-page React client built with Vite. All processing happens locally in the browser.

## Main Modules

- `src/App.tsx`: orchestrates the workspace and high-level state.
- `src/lib/archive.ts`: extracts images from ZIP uploads and generates ZIP exports.
- `src/lib/image-processing.ts`: resizes images, applies enhancements, and exports output blobs.
- `src/lib/presets.ts`: stores common print and screen dimension presets.
- `src/components/*`: UI sections for upload, settings, queue, and result previews.

## Data Flow

1. The user uploads image files or a ZIP archive.
2. The import layer normalizes every file into an internal image item model.
3. The processing layer inspects source dimensions.
4. The UI compares source size against target size and flags images that need upscaling.
5. When processing starts, the app renders every image into a working canvas, applies filter-based enhancements, and optionally sharpens the result.
6. Pica performs the resize step for both downscaling and browser-side upscaling.
7. The final image is centered inside the requested frame or cropped in cover mode.
8. The app exports processed images as browser blobs and offers direct download or ZIP packaging.

## Processing Rules

- Aspect ratio is preserved at all times.
- The chosen target size defines the render frame.
- DPI metadata is represented in the exported file name and user-facing summary. Browser image export APIs do not reliably embed print DPI metadata across formats.
- Upscaling is optional and only applied when the source image is smaller than the requested output.
- `contain` preserves the full image inside the frame and may introduce background margins.
- `cover` fills the target frame and crops overflow while preserving aspect ratio.

## Future Extension Points

- WebAssembly-based super-resolution.
- Persistent presets in local storage.
- Drag-and-drop ordering and grouping.
