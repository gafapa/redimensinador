# Project Rules

## Language

- Code identifiers must use English.
- Markdown documentation must remain in English.
- Code comments and commit messages must remain in English.

## Product Rules

- Keep the application frontend-only.
- Prefer browser-native APIs unless a dependency clearly reduces complexity.
- Treat print sizing in centimeters as the primary unit in the UI.
- Preserve image aspect ratio during resize operations.
- Never upscale by default without explicit user consent.
- Expose common print size presets first, then allow custom dimensions.
- Surface clear warnings when the source image is below the requested target size.

## Engineering Rules

- Update documentation whenever the image workflow or architecture changes.
- Keep the UI simple to scan and easy to operate on desktop and mobile.
- Favor deterministic processing helpers over logic embedded directly in React components.
- Validate the production build before closing a task.
