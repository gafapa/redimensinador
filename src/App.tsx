import { startTransition, useDeferredValue, useEffect, useRef, useState } from 'react';
import { DropZone } from './components/DropZone';
import { QueuePanel } from './components/QueuePanel';
import { SettingsPanel } from './components/SettingsPanel';
import { buildZipBundle, extractImagesFromZip, isImageFile, isZipFile } from './lib/archive';
import { formatCentimeters, getTargetPixels, processImage, readImageDimensions, shouldUpscale } from './lib/image-processing';
import { defaultSettings } from './lib/presets';
import type { InputImage, ProcessedImage } from './types';

function App() {
  const [settings, setSettings] = useState(defaultSettings);
  const [images, setImages] = useState<InputImage[]>([]);
  const [results, setResults] = useState<ProcessedImage[]>([]);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState('Ready');
  const imagesRef = useRef<InputImage[]>([]);
  const resultsRef = useRef<ProcessedImage[]>([]);

  const deferredImages = useDeferredValue(images);
  const targetPixels = getTargetPixels(settings);
  const upscaleCount = deferredImages.filter((image) => shouldUpscale(image, settings)).length;

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

    setStatus('Loading');
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

    setStatus(`${importedImages.length} files`);
  };

  const handleProcess = async () => {
    setProcessing(true);
    setStatus('Processing');

    const processed: ProcessedImage[] = [];
    let errorCount = 0;

    for (const image of images) {
      try {
        processed.push(await processImage(image, settings));
      } catch (error) {
        errorCount += 1;
        processed.push({
          id: image.id,
          name: image.name,
          blob: new Blob(),
          objectUrl: '',
          width: 0,
          height: 0,
          dpi: settings.dpi,
          upscaleApplied: false,
          error: error instanceof Error ? error.message : 'Processing failed',
        });
      }
    }

    startTransition(() => {
      setResults((current) => {
        current.forEach((item) => { if (item.objectUrl) URL.revokeObjectURL(item.objectUrl); });
        return processed;
      });
    });

    const okCount = processed.length - errorCount;
    setStatus(errorCount > 0 ? `${okCount} ready, ${errorCount} failed` : `${okCount} ready`);
    setProcessing(false);
  };

  const handleDownloadZip = async () => {
    const zipBlob = await buildZipBundle(results);
    const url = URL.createObjectURL(zipBlob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `print_${formatCentimeters(settings.widthCm)}x${formatCentimeters(settings.heightCm)}cm_${settings.dpi}dpi.zip`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    images.forEach((item) => URL.revokeObjectURL(item.objectUrl));
    results.forEach((item) => URL.revokeObjectURL(item.objectUrl));
    setImages([]);
    setResults([]);
    setStatus('Ready');
  };

  return (
    <div className="app-shell">
      <main className="workspace">
        <section className="topbar">
          <div className="title-block">
            <h1>Print Resize</h1>
            <p>
              {formatCentimeters(settings.widthCm)} x {formatCentimeters(settings.heightCm)} cm · {settings.dpi} DPI
            </p>
          </div>
          <div className="top-stats">
            <span><b>{deferredImages.length}</b> files</span>
            <span><b>{upscaleCount}</b> upscale</span>
            <span><b>{targetPixels.width} x {targetPixels.height}</b> px</span>
          </div>
        </section>

        <section className="panel intro-panel">
          <DropZone disabled={processing} onSelectFiles={handleFiles} />
          <div className="status-strip">
            <p>{status}</p>
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
