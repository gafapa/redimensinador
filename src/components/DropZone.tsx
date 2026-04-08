import type { ChangeEvent, DragEvent } from 'react';

type DropZoneProps = {
  disabled?: boolean;
  onSelectFiles: (files: FileList | null) => void;
};

export function DropZone({ disabled, onSelectFiles }: DropZoneProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onSelectFiles(event.target.files);
    event.target.value = '';
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    if (disabled) {
      return;
    }
    onSelectFiles(event.dataTransfer.files);
  };

  return (
    <label
      className={`drop-zone${disabled ? ' is-disabled' : ''}`}
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
    >
      <input type="file" multiple accept="image/*,.zip" onChange={handleChange} disabled={disabled} />
      <span className="eyebrow">Import</span>
      <strong>Drop images here or select files and ZIP archives</strong>
      <p>JPG, PNG, WEBP or a ZIP with mixed image files. Processing stays local in the browser.</p>
    </label>
  );
}
