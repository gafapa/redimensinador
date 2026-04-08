import { shouldUpscale } from '../lib/image-processing';
import type { InputImage, ProcessedImage, ResizeSettings } from '../types';

type QueuePanelProps = {
  images: InputImage[];
  results: ProcessedImage[];
  settings: ResizeSettings;
  processing: boolean;
  onProcess: () => void;
  onDownloadZip: () => void;
  onClear: () => void;
};

export function QueuePanel({
  images,
  results,
  settings,
  processing,
  onProcess,
  onDownloadZip,
  onClear,
}: QueuePanelProps) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <span className="eyebrow">Batch</span>
        <h2>Queue and export</h2>
      </div>

      <div className="queue-actions">
        <button type="button" className="primary-button" onClick={onProcess} disabled={!images.length || processing}>
          {processing ? 'Processing...' : 'Process batch'}
        </button>
        <button type="button" className="secondary-button" onClick={onDownloadZip} disabled={!results.length}>
          Download ZIP
        </button>
        <button type="button" className="secondary-button" onClick={onClear} disabled={processing || (!images.length && !results.length)}>
          Clear
        </button>
      </div>

      <div className="queue-list">
        {images.length ? (
          images.map((image) => {
            const upscaleNeeded = shouldUpscale(image, settings);
            return (
              <article key={image.id} className="queue-item">
                <img src={image.objectUrl} alt={image.name} />
                <div>
                  <h3>{image.name}</h3>
                  <p>
                    {image.width}×{image.height} px
                  </p>
                  <p>{upscaleNeeded ? 'Smaller than target output.' : 'Ready for direct resize.'}</p>
                </div>
              </article>
            );
          })
        ) : (
          <p className="empty-state">No images loaded yet.</p>
        )}
      </div>

      {results.length > 0 && (
        <div className="results-grid">
          {results.map((result) => (
            <article key={result.id} className="result-card">
              <img src={result.objectUrl} alt={result.name} />
              <div>
                <h3>{result.name}</h3>
                <p>
                  {result.width}×{result.height} px · {result.dpi} DPI
                </p>
                <p>{result.upscaleApplied ? 'Upscaled during export.' : result.warning ?? 'No upscaling was needed.'}</p>
                <a href={result.objectUrl} download={result.name} className="download-link">
                  Download file
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
