import { formatCentimeters, getTargetPixels, shouldUpscale } from '../lib/image-processing';
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
  const targetPixels = getTargetPixels(settings);

  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>Files</h2>
      </div>

      <div className="queue-actions">
        <button type="button" className="primary-button" onClick={onProcess} disabled={!images.length || processing}>
          {processing ? 'Processing...' : 'Process'}
        </button>
        <button type="button" className="secondary-button" onClick={onDownloadZip} disabled={!results.length}>
          ZIP
        </button>
        <button type="button" className="secondary-button" onClick={onClear} disabled={processing || (!images.length && !results.length)}>
          Clear
        </button>
      </div>

      <div className="queue-list">
        {images.length ? (
          images.map((image) => (
            <article key={image.id} className="queue-item">
              <img src={image.objectUrl} alt={image.name} />
              <div>
                <h3>{image.name}</h3>
                <p>{image.width} x {image.height} px</p>
                <p>{shouldUpscale(image, settings) ? 'Upscale' : 'OK'}</p>
              </div>
            </article>
          ))
        ) : (
          <p className="empty-state">No files</p>
        )}
      </div>

      {results.length > 0 && (
        <div className="results-grid">
          {results.map((result) => (
            <article key={result.id} className="result-card">
              <img src={result.objectUrl} alt={result.name} />
              <div>
                <h3>{result.name}</h3>
                <p>{formatCentimeters(settings.widthCm)} x {formatCentimeters(settings.heightCm)} cm</p>
                <p>{targetPixels.width} x {targetPixels.height} px / {result.dpi} DPI</p>
                <a href={result.objectUrl} download={result.name} className="download-link">
                  Download
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
