import { startTransition, useEffect, useRef, useState } from 'react';
import { ConfigView } from './components/ConfigView';
import { ExecuteView } from './components/ExecuteView';
import { buildZipBundle, extractImagesFromZip, isImageFile, isZipFile } from './lib/archive';
import { formatCentimeters, processImage, readImageDimensions } from './lib/image-processing';
import { defaultSettings } from './lib/presets';
import type { ImageRow, ResizeSettings } from './types';

type View = 'config' | 'execute';

function App() {
  const [view, setView] = useState<View>('execute');
  const [settings, setSettings] = useState(defaultSettings);
  const [rows, setRows] = useState<ImageRow[]>([]);
  const [processing, setProcessing] = useState(false);
  const rowsRef = useRef<ImageRow[]>([]);

  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  useEffect(() => {
    return () => {
      rowsRef.current.forEach((row) => {
        URL.revokeObjectURL(row.input.objectUrl);
        if (row.result?.objectUrl) URL.revokeObjectURL(row.result.objectUrl);
      });
    };
  }, []);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList?.length) return;

    const newRows: ImageRow[] = [];

    for (const file of Array.from(fileList)) {
      if (isZipFile(file)) {
        const filesFromZip = await extractImagesFromZip(file);
        for (const entry of filesFromZip) {
          const dims = await readImageDimensions(entry);
          newRows.push({
            input: {
              id: crypto.randomUUID(),
              name: entry.name,
              source: 'zip',
              file: entry,
              objectUrl: dims.objectUrl,
              width: dims.width,
              height: dims.height,
              aspectRatio: dims.width / dims.height,
            },
            status: 'pending',
          });
        }
        continue;
      }

      if (!isImageFile(file)) continue;

      const dims = await readImageDimensions(file);
      newRows.push({
        input: {
          id: crypto.randomUUID(),
          name: file.name,
          source: 'file',
          file,
          objectUrl: dims.objectUrl,
          width: dims.width,
          height: dims.height,
          aspectRatio: dims.width / dims.height,
        },
        status: 'pending',
      });
    }

    startTransition(() => {
      setRows((current) => [...current, ...newRows]);
    });
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
    URL.revokeObjectURL(url);
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
