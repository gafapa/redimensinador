import type { ChangeEvent, DragEvent } from 'react';

type DropZoneProps = {
  disabled?: boolean;
  label?: string;
  onSelectFiles: (files: FileList | null) => void;
};

export function DropZone({ disabled, label = 'Add images or ZIP', onSelectFiles }: DropZoneProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onSelectFiles(event.target.files);
    event.target.value = '';
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    if (disabled) return;
    onSelectFiles(event.dataTransfer.files);
  };

  return (
    <label
      className={`drop-zone${disabled ? ' is-disabled' : ''}`}
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
    >
      <input type="file" multiple accept="image/*,.zip" onChange={handleChange} disabled={disabled} />
      <strong>{label}</strong>
    </label>
  );
}
