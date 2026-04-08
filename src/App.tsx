import { startTransition, useDeferredValue, useEffect, useRef, useState } from 'react';
import { DropZone } from './components/DropZone';
import { QueuePanel } from './components/QueuePanel';
import { SettingsPanel } from './components/SettingsPanel';
import { buildZipBundle, extractImagesFromZip, isImageFile, isZipFile } from './lib/archive';
import { processImage, readImageDimensions, shouldUpscale } from './lib/image-processing';
import { defaultSettings } from './lib/presets';
import type { InputImage, ProcessedImage } from './types';

function App() {
  const [settings, setSettings] = useState(defaultSettings);
  const [images, setImages] = useState<InputImage[]>([]);
  const [results, setResults] = useState<ProcessedImage[]>([]);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState('Load a batch to start.');
  const imagesRef = useRef<InputImage[]>([]);
  const resultsRef = useRef<ProcessedImage[]>([]);

  const deferredImages = useDeferredValue(images);

  const summary = {
    total: deferredImages.length,
    upscaleCount: deferredImages.filter((image) => shouldUpscale(image, settings)).length,
  };

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    resultsRef.current = results;
  }, [results]);

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((item) => URL.revokeObjectURL(item.objectUrl));
      resultsRef.current.forEach((item) => URL.revokeObjectURL(item.objectUrl));
    };
  }, []);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList?.length) {
      return;
    }

    setStatus('Reading files...');
    const importedImages: InputImage[] = [];

    for (const file of Array.from(fileList)) {
      if (isZipFile(file)) {
        const filesFromZip = await extractImagesFromZip(file);
        for (const entry of filesFromZip) {
          const dimensions = await readImageDimensions(entry);
          importedImages.push({
            id: crypto.randomUUID(),
            name: entry.name,
            source: 'zip',
            file: entry,
            objectUrl: dimensions.objectUrl,
            width: dimensions.width,
            height: dimensions.height,
            aspectRatio: dimensions.width / dimensions.height,
          });
        }
        continue;
      }

      if (!isImageFile(file)) {
        continue;
      }

      const dimensions = await readImageDimensions(file);
      importedImages.push({
        id: crypto.randomUUID(),
        name: file.name,
        source: 'file',
        file,
        objectUrl: dimensions.objectUrl,
        width: dimensions.width,
        height: dimensions.height,
        aspectRatio: dimensions.width / dimensions.height,
      });
    }

    startTransition(() => {
      setImages((current) => [...current, ...importedImages]);
      setResults((current) => {
        current.forEach((item) => URL.revokeObjectURL(item.objectUrl));
        return [];
      });
    });

    setStatus(`${importedImages.length} image${importedImages.length === 1 ? '' : 's'} ready.`);
  };

  const handleProcess = async () => {
    setProcessing(true);
    setStatus('Processing batch...');

    try {
      const processed: ProcessedImage[] = [];
      for (const image of images) {
        const result = await processImage(image, settings);
        processed.push(result);
      }

      startTransition(() => {
        setResults((current) => {
          current.forEach((item) => URL.revokeObjectURL(item.objectUrl));
          return processed;
        });
      });
      setStatus(`${processed.length} output file${processed.length === 1 ? '' : 's'} ready.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Processing failed.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadZip = async () => {
    const zipBlob = await buildZipBundle(results);
    const url = URL.createObjectURL(zipBlob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `image-batch_${settings.width}x${settings.height}_${settings.dpi}dpi.zip`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    images.forEach((item) => URL.revokeObjectURL(item.objectUrl));
    results.forEach((item) => URL.revokeObjectURL(item.objectUrl));
    setImages([]);
    setResults([]);
    setStatus('Queue cleared.');
  };

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Image Batch Resizer</span>
          <h1>Resize entire image sets for print, social and web in one pass.</h1>
          <p>
            Upload loose files or a ZIP, pick a popular target size, set DPI, and export a clean batch without leaving the
            browser.
          </p>
        </div>
        <div className="hero-metrics">
          <div>
            <strong>{summary.total}</strong>
            <span>Loaded images</span>
          </div>
          <div>
            <strong>{summary.upscaleCount}</strong>
            <span>Need upscaling</span>
          </div>
          <div>
            <strong>
              {settings.width}×{settings.height}
            </strong>
            <span>Target frame</span>
          </div>
        </div>
      </header>

      <main className="workspace">
        <section className="panel intro-panel">
          <DropZone disabled={processing} onSelectFiles={handleFiles} />
          <div className="status-strip">
            <p>{status}</p>
            <p>{settings.upscaleMode === 'off' ? 'Upscaling disabled.' : 'Upscaling ready for undersized sources.'}</p>
          </div>
        </section>

        <div className="workspace-grid">
          <SettingsPanel settings={settings} onSettingsChange={setSettings} />
          <QueuePanel
            images={images}
            results={results}
            settings={settings}
            processing={processing}
            onProcess={handleProcess}
            onDownloadZip={handleDownloadZip}
            onClear={handleClear}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
