# Print Image Resizer

Client-side React + Vite app for preparing image batches for print.

## Goals

- Import loose images or a ZIP archive.
- Work with print sizes in centimeters.
- Convert target size to pixels using DPI.
- Keep aspect ratio with contain or cover fit modes.
- Offer optional upscaling and simple image adjustments.
- Export processed files individually or as a ZIP bundle.

## Stack

- React
- Vite
- TypeScript
- Browser Canvas API
- JSZip
- Pica

## Workflow

1. Add images or a ZIP archive.
2. Choose a print size in centimeters and a DPI value.
3. Process the batch locally in the browser.
4. Download files or a ZIP bundle.

## Constraints

- No backend services.
- All image processing runs in the browser.
- Browser exports do not reliably embed print DPI metadata in every output format, so DPI is used to calculate output pixel dimensions and is surfaced in naming and UI.
- Very large batches may use significant memory depending on image dimensions.

## Development Note

- If a previous local project registered a service worker on the same `localhost` origin, the dev build may receive stale cached assets. The app defensively unregisters service workers in development mode.

## Status

Print-oriented centimeter workflow implemented and production build verified.
