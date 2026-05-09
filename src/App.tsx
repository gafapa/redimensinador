import { startTransition, useEffect, useRef, useState } from 'react';
import { ConfigView } from './components/ConfigView';
import { ExecuteView } from './components/ExecuteView';
import { buildZipBundle, extractAcceptedFilesFromZip, extractImagesFromPdf, isImageFile, isPdfFile, isZipFile } from './lib/archive';
import { formatCentimeters, processImage, readImageDimensions } from './lib/image-processing';
import { defaultSettings } from './lib/presets';
import type { ImageRow, InputImage, ResizeSettings } from './types';

type View = 'config' | 'execute';
const settingsStorageKey = 'printfit-studio:settings';

function App() {
  const [view, setView] = useState<View>('execute');
  const [settings, setSettings] = useState<ResizeSettings>(() => loadStoredSettings());
  const [rows, setRows] = useState<ImageRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [processing, setProcessing] = useState(false);
  const rowsRef = useRef<ImageRow[]>([]);

  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  useEffect(() => {
    window.localStorage.setItem(settingsStorageKey, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    const handleWindowDragOver = (event: DragEvent) => {
      if (!Array.from(event.dataTransfer?.types ?? []).includes('Files')) return;
      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = view === 'execute' && !processing && !importing ? 'copy' : 'none';
      }
    };

    const handleWindowDrop = (event: DragEvent) => {
      if (!Array.from(event.dataTransfer?.types ?? []).includes('Files')) return;
      event.preventDefault();
      if (view !== 'execute' || processing || importing) return;
      void handleFiles(event.dataTransfer?.files ?? null);
    };

    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('drop', handleWindowDrop);

    return () => {
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, [importing, processing, view]);

  useEffect(() => {
    return () => {
      rowsRef.current.forEach((row) => {
        URL.revokeObjectURL(row.input.objectUrl);
        if (row.result?.objectUrl) URL.revokeObjectURL(row.result.objectUrl);
      });
    };
  }, []);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList?.length || importing) return;

    setImporting(true);

    try {
      const newRows: ImageRow[] = [];

      for (const file of Array.from(fileList)) {
        if (isZipFile(file)) {
          const filesFromZip = await extractAcceptedFilesFromZip(file);
          const rowsFromZip = await buildRowsFromFiles(filesFromZip, 'zip');
          newRows.push(...rowsFromZip);
          continue;
        }

        if (isPdfFile(file)) {
          const filesFromPdf = await extractImagesFromPdf(file);
          const rowsFromPdf = await buildRowsFromFiles(filesFromPdf, 'pdf');
          newRows.push(...rowsFromPdf);
          continue;
        }

        if (!isImageFile(file)) continue;

        const rowsFromImages = await buildRowsFromFiles([file], 'file');
        newRows.push(...rowsFromImages);
      }

      startTransition(() => {
        setRows((current) => [...current, ...newRows]);
      });
    } finally {
      setImporting(false);
    }
  };

  const handleProcess = async () => {
    const currentRows = rows;
    if (!currentRows.length) return;

    setProcessing(true);
    const capturedSettings: ResizeSettings = settings;

    for (const row of currentRows) {
      const id = row.input.id;

      if (row.result?.objectUrl) URL.revokeObjectURL(row.result.objectUrl);

      setRows((prev) =>
        prev.map((r) =>
          r.input.id === id ? { ...r, status: 'processing', result: undefined, error: undefined } : r,
        ),
      );

      try {
        const result = await processImage(row.input, capturedSettings);
        setRows((prev) =>
          prev.map((r) => (r.input.id === id ? { ...r, status: 'done', result } : r)),
        );
      } catch (error) {
        setRows((prev) =>
          prev.map((r) =>
            r.input.id === id
              ? { ...r, status: 'error', error: error instanceof Error ? error.message : 'Processing failed' }
              : r,
          ),
        );
      }
    }

    setProcessing(false);
  };

  const handleDownloadZip = async () => {
    const results = rowsRef.current.filter((r) => r.result).map((r) => r.result!);
    if (!results.length) return;

    const zipBlob = await buildZipBundle(results);
    const url = URL.createObjectURL(zipBlob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `print_${formatCentimeters(settings.widthCm)}x${formatCentimeters(settings.heightCm)}cm_${settings.dpi}dpi.zip`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const handleClear = () => {
    rowsRef.current.forEach((row) => {
      URL.revokeObjectURL(row.input.objectUrl);
      if (row.result?.objectUrl) URL.revokeObjectURL(row.result.objectUrl);
    });
    setRows([]);
  };

  if (view === 'config') {
    return (
      <ConfigView
        settings={settings}
        onSettingsChange={setSettings}
        onBack={() => setView('execute')}
      />
    );
  }

  return (
    <ExecuteView
      settings={settings}
      rows={rows}
      importing={importing}
      processing={processing}
      onFiles={handleFiles}
      onProcess={handleProcess}
      onDownloadZip={handleDownloadZip}
      onClear={handleClear}
      onConfigClick={() => setView('config')}
    />
  );
}

export default App;

async function buildRowsFromFiles(files: File[], source: InputImage['source']) {
  const rows: ImageRow[] = [];

  for (const file of files) {
    const dims = await readImageDimensions(file);
    rows.push({
      input: {
        id: crypto.randomUUID(),
        name: file.name,
        source,
        file,
        objectUrl: dims.objectUrl,
        width: dims.width,
        height: dims.height,
        aspectRatio: dims.width / dims.height,
      },
      status: 'pending',
    });
  }

  return rows;
}

function loadStoredSettings(): ResizeSettings {
  try {
    const rawSettings = window.localStorage.getItem(settingsStorageKey);
    if (!rawSettings) {
      return defaultSettings;
    }

    return normalizeSettings(JSON.parse(rawSettings));
  } catch {
    return defaultSettings;
  }
}

function normalizeSettings(value: unknown): ResizeSettings {
  if (!value || typeof value !== 'object') {
    return defaultSettings;
  }

  const candidate = value as Partial<ResizeSettings>;
  const enhancements =
    candidate.enhancements && typeof candidate.enhancements === 'object'
      ? candidate.enhancements
      : defaultSettings.enhancements;

  return {
    presetId: typeof candidate.presetId === 'string' ? candidate.presetId : defaultSettings.presetId,
    widthCm: getFiniteNumber(candidate.widthCm, defaultSettings.widthCm, 0.1),
    heightCm: getFiniteNumber(candidate.heightCm, defaultSettings.heightCm, 0.1),
    dpi: getFiniteNumber(candidate.dpi, defaultSettings.dpi, 1),
    fitMode: candidate.fitMode === 'cover' ? 'cover' : 'contain',
    upscaleMode: candidate.upscaleMode === 'off' || candidate.upscaleMode === 'detail' ? candidate.upscaleMode : 'balanced',
    orientationMode:
      candidate.orientationMode === 'auto' ||
      candidate.orientationMode === 'portrait' ||
      candidate.orientationMode === 'landscape'
        ? candidate.orientationMode
        : 'auto',
    outputFormat:
      candidate.outputFormat === 'png' || candidate.outputFormat === 'webp' ? candidate.outputFormat : 'jpeg',
    quality: getFiniteNumber(candidate.quality, defaultSettings.quality, 0.1, 1),
    background:
      typeof candidate.background === 'string' && /^#[0-9a-f]{6}$/i.test(candidate.background)
        ? candidate.background
        : defaultSettings.background,
    enhancements: {
      brightness: getFiniteNumber(enhancements.brightness, defaultSettings.enhancements.brightness, 0),
      contrast: getFiniteNumber(enhancements.contrast, defaultSettings.enhancements.contrast, 0),
      saturation: getFiniteNumber(enhancements.saturation, defaultSettings.enhancements.saturation, 0),
      sharpen: getFiniteNumber(enhancements.sharpen, defaultSettings.enhancements.sharpen, 0),
      autoTone: Boolean(enhancements.autoTone),
    },
  };
}

function getFiniteNumber(value: unknown, fallback: number, min?: number, max?: number) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }

  if (min !== undefined && value < min) {
    return fallback;
  }

  if (max !== undefined && value > max) {
    return fallback;
  }

  return value;
}
