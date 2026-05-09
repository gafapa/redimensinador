import { useEffect } from 'react';
import { useI18n } from '../lib/i18n';
import type { ImageRow } from '../types';

type ComparisonModalProps = {
  row: ImageRow;
  hasPrevious: boolean;
  hasNext: boolean;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
};

export function ComparisonModal({
  row,
  hasPrevious,
  hasNext,
  onClose,
  onPrevious,
  onNext,
}: ComparisonModalProps) {
  const { tr } = useI18n();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'ArrowLeft' && hasPrevious) {
        onPrevious();
      } else if (event.key === 'ArrowRight' && hasNext) {
        onNext();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [hasNext, hasPrevious, onClose, onNext, onPrevious]);

  if (!row.result) {
    return null;
  }

  return (
    <div className="comparison-modal" onClick={onClose} role="presentation">
      <div
        className="comparison-modal__dialog"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`${tr.comparison} ${row.input.name}`}
      >
        <div className="comparison-modal__header">
          <div>
            <h2 className="comparison-modal__title">{tr.comparison}</h2>
            <p className="comparison-modal__name">{row.input.name}</p>
          </div>
          <div className="comparison-modal__controls">
            <button type="button" className="secondary-button" onClick={onPrevious} disabled={!hasPrevious}>
              {tr.previous}
            </button>
            <button type="button" className="secondary-button" onClick={onNext} disabled={!hasNext}>
              {tr.next}
            </button>
            <button type="button" className="secondary-button" onClick={onClose}>
              {tr.close}
            </button>
          </div>
        </div>

        <div className="comparison-modal__grid">
          <section className="comparison-card">
            <div className="comparison-card__meta">
              <span className="comparison-card__label">{tr.before}</span>
              <span className="comparison-card__dims">
                {row.input.width} x {row.input.height} px
              </span>
            </div>
            <img className="comparison-card__image" src={row.input.objectUrl} alt={`${tr.before} ${row.input.name}`} />
          </section>

          <section className="comparison-card">
            <div className="comparison-card__meta">
              <span className="comparison-card__label">{tr.after}</span>
              <span className="comparison-card__dims">
                {row.result.width} x {row.result.height} px
              </span>
            </div>
            <img className="comparison-card__image" src={row.result.objectUrl} alt={`${tr.after} ${row.input.name}`} />
          </section>
        </div>
      </div>
    </div>
  );
}
