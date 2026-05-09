import { useI18n } from '../lib/i18n';
import type { ImageRow } from '../types';

type ImageRowItemProps = {
  row: ImageRow;
  onCompare: (row: ImageRow) => void;
};

export function ImageRowItem({ row, onCompare }: ImageRowItemProps) {
  const { tr } = useI18n();
  const { input, status, result, error } = row;
  const thumbSrc = status === 'done' && result ? result.objectUrl : input.objectUrl;

  return (
    <article className={`image-row image-row--${status}`}>
      <img className="image-row__thumb" src={thumbSrc} alt={input.name} />

      <div className="image-row__info">
        <p className="image-row__name">{input.name}</p>
        <p className="image-row__dims">
          {input.width} × {input.height} px
          {status === 'done' && result && (
            <> → {result.width} × {result.height} px</>
          )}
        </p>
        {status === 'error' && error && (
          <p className="image-row__error">{error}</p>
        )}
        {status === 'done' && result?.warning && (
          <p className="image-row__warning">{result.warning === 'upscaleNeeded' ? tr.upscaleNeeded : result.warning}</p>
        )}
      </div>

      <div className="image-row__status">
        {status === 'pending'    && <span className="badge badge--pending">{tr.pending}</span>}
        {status === 'processing' && <span className="badge badge--processing">{tr.processing}</span>}
        {status === 'done'       && <span className="badge badge--done">{tr.done}</span>}
        {status === 'error'      && <span className="badge badge--error">{tr.error}</span>}
      </div>

      {status === 'done' && result ? (
        <div className="image-row__actions">
          <button type="button" className="secondary-button image-row__compare" onClick={() => onCompare(row)}>
            {tr.compare}
          </button>
          <a href={result.objectUrl} download={result.name} className="image-row__download" title={result.name}>
            ↓
          </a>
        </div>
      ) : (
        <span className="image-row__download-placeholder" />
      )}
    </article>
  );
}
