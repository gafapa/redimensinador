import { DropZone } from './DropZone';
import { ImageRowItem } from './ImageRowItem';
import { LangSelector } from './LangSelector';
import { formatCentimeters } from '../lib/image-processing';
import { useI18n } from '../lib/i18n';
import type { ImageRow, ResizeSettings } from '../types';

type ExecuteViewProps = {
  settings: ResizeSettings;
  rows: ImageRow[];
  processing: boolean;
  onFiles: (files: FileList | null) => void;
  onProcess: () => void;
  onDownloadZip: () => void;
  onClear: () => void;
  onConfigClick: () => void;
};

export function ExecuteView({
  settings,
  rows,
  processing,
  onFiles,
  onProcess,
  onDownloadZip,
  onClear,
  onConfigClick,
}: ExecuteViewProps) {
  const { tr } = useI18n();
  const doneCount = rows.filter((r) => r.status === 'done').length;

  return (
    <div className="view-shell">
      <header className="view-header">
        <div className="view-header__left">
          <div className="view-header__title-block">
            <h1 className="view-header__title">{tr.appTitle}</h1>
            <p className="view-header__sub">
              {formatCentimeters(settings.widthCm)} × {formatCentimeters(settings.heightCm)} cm · {settings.dpi} DPI
            </p>
          </div>
        </div>
        <div className="view-header__right">
          <LangSelector />
          <button type="button" className="secondary-button" onClick={onConfigClick} disabled={processing}>
            {tr.settings}
          </button>
        </div>
      </header>

      <div className="execute-drop">
        <DropZone disabled={processing} onSelectFiles={onFiles} label={tr.dropZoneLabel} />
      </div>

      {rows.length > 0 && (
        <div className="execute-actions">
          <button type="button" className="primary-button" onClick={onProcess} disabled={processing}>
            {processing ? tr.processing : tr.processAll}
          </button>
          <button type="button" className="secondary-button" onClick={onDownloadZip} disabled={!doneCount}>
            ZIP {doneCount > 0 ? `(${doneCount})` : ''}
          </button>
          <button type="button" className="secondary-button" onClick={onClear} disabled={processing}>
            {tr.clear}
          </button>
        </div>
      )}

      {rows.length > 0 ? (
        <div className="image-list">
          {rows.map((row) => (
            <ImageRowItem key={row.input.id} row={row} />
          ))}
        </div>
      ) : (
        <p className="execute-empty">{tr.dropHint}</p>
      )}
    </div>
  );
}
