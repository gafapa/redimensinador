import { useRef, useState, type ChangeEvent, type DragEvent, type KeyboardEvent } from 'react';

type DropZoneProps = {
  disabled?: boolean;
  label?: string;
  onSelectFiles: (files: FileList | null) => void;
};

export function DropZone({ disabled, label = 'Add images or ZIP', onSelectFiles }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dragDepthRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onSelectFiles(event.target.files);
    event.target.value = '';
  };

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled || !hasFilePayload(event.dataTransfer)) return;
    dragDepthRef.current += 1;
    setIsDragging(true);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!hasFilePayload(event.dataTransfer)) return;
    event.dataTransfer.dropEffect = disabled ? 'none' : 'copy';
    if (!disabled && !isDragging) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled || !hasFilePayload(event.dataTransfer)) return;
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current = 0;
    setIsDragging(false);
    if (disabled) return;
    onSelectFiles(getDroppedFiles(event.dataTransfer));
  };

  return (
    <div
      className={`drop-zone${disabled ? ' is-disabled' : ''}${isDragging ? ' is-dragging' : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
        if (disabled) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
      role="button"
      tabIndex={disabled ? -1 : 0}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,.pdf,application/pdf,.zip"
        onChange={handleChange}
        disabled={disabled}
      />
      <strong>{label}</strong>
    </div>
  );
}

function hasFilePayload(dataTransfer: DataTransfer) {
  return Array.from(dataTransfer.types).includes('Files');
}

function getDroppedFiles(dataTransfer: DataTransfer) {
  if (dataTransfer.files.length > 0) {
    return dataTransfer.files;
  }

  const fileEntries = Array.from(dataTransfer.items)
    .filter((item) => item.kind === 'file')
    .map((item) => item.getAsFile())
    .filter((file): file is File => file !== null);

  if (fileEntries.length === 0) {
    return null;
  }

  const transfer = new DataTransfer();
  fileEntries.forEach((file) => transfer.items.add(file));
  return transfer.files;
}
