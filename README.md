# Image Batch Resizer

Client-side React + Vite web app for resizing and improving image batches without a backend.

## Goals

- Import individual image files or a ZIP archive.
- Resize images to common target formats while preserving aspect ratio.
- Let the user choose output DPI.
- Offer upscaling when the source image is smaller than the target.
- Provide lightweight enhancement controls before export.
- Export processed images individually or as a ZIP bundle.
- Support both contain and cover fit modes.

## Stack

- React
- Vite
- TypeScript
- Browser Canvas API
- JSZip
- Pica

## Workflow

1. Upload images or a ZIP archive.
2. Pick a target size preset or custom dimensions.
3. Choose DPI and fit strategy.
4. Enable optional upscaling and image enhancements.
5. Process the batch locally in the browser.
6. Download processed files.

## Constraints

- No backend services.
- All image processing runs in the browser.
- Browser exports do not reliably embed print DPI metadata in every output format, so DPI is applied as an output target and surfaced in naming and UI.
- Very large batches may use significant memory depending on image dimensions.

## Status

Initial version implemented and production build verified.
