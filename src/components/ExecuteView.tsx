import { useState } from 'react';
import { ComparisonModal } from './ComparisonModal';
import { DropZone } from './DropZone';
import { ImageRowItem } from './ImageRowItem';
import { LangSelector } from './LangSelector';
import { AppIcon } from './AppIcon';
import { formatCentimeters } from '../lib/image-processing';
import { useI18n } from '../lib/i18n';
import type { ImageRow, ResizeSettings } from '../types';

type ExecuteViewProps = {
  settings: ResizeSettings;
  rows: ImageRow[];
  importing: boolean;
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
  importing,
  processing,
  onFiles,
  onProcess,
  onDownloadZip,
  onClear,
  onConfigClick,
}: ExecuteViewProps) {
  const { tr } = useI18n();
  const [comparisonRowId, setComparisonRowId] = useState<string | null>(null);
  const doneCount = rows.filter((r) => r.status === 'done').length;
  const completedRows = rows.filter((row) => row.status === 'done' && row.result);
  const comparisonIndex = comparisonRowId
    ? completedRows.findIndex((row) => row.input.id === comparisonRowId)
    : -1;
  const comparisonRow = comparisonIndex >= 0 ? completedRows[comparisonIndex] : null;

  return (
    <div className="view-shell">
      <header className="view-header">
        <div className="view-header__left">
          <AppIcon />
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
        <DropZone disabled={processing || importing} onSelectFiles={onFiles} label={tr.dropZoneLabel} />
        {importing && (
          <div className="loading-strip" aria-live="polite">
            <span className="loading-strip__spinner" />
            <span>{tr.importing}</span>
          </div>
        )}
      </div>

      {rows.length > 0 && (
        <div className="execute-actions">
          <button type="button" className="primary-button" onClick={onProcess} disabled={processing || importing}>
            {processing ? tr.processing : tr.processAll}
          </button>
          <button type="button" className="secondary-button" onClick={onDownloadZip} disabled={!doneCount}>
            ZIP {doneCount > 0 ? `(${doneCount})` : ''}
          </button>
          <button type="button" className="secondary-button" onClick={onClear} disabled={processing || importing}>
            {tr.clear}
          </button>
        </div>
      )}

      {rows.length > 0 ? (
        <div className="image-list">
          {rows.map((row) => (
            <ImageRowItem key={row.input.id} row={row} onCompare={(selectedRow) => setComparisonRowId(selectedRow.input.id)} />
          ))}
        </div>
      ) : (
        <p className="execute-empty">{tr.dropHint}</p>
      )}

      {comparisonRow && (
        <ComparisonModal
          row={comparisonRow}
          hasPrevious={comparisonIndex > 0}
          hasNext={comparisonIndex >= 0 && comparisonIndex < completedRows.length - 1}
          onPrevious={() => {
            if (comparisonIndex > 0) {
              setComparisonRowId(completedRows[comparisonIndex - 1].input.id);
            }
          }}
          onNext={() => {
            if (comparisonIndex >= 0 && comparisonIndex < completedRows.length - 1) {
              setComparisonRowId(completedRows[comparisonIndex + 1].input.id);
            }
          }}
          onClose={() => setComparisonRowId(null)}
        />
      )}
    </div>
  );
}
