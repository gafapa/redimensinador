import { dpiOptions, imagePresets } from '../lib/presets';
import { formatCentimeters, getTargetPixels } from '../lib/image-processing';
import type { ResizeSettings } from '../types';

type SettingsPanelProps = {
  settings: ResizeSettings;
  onSettingsChange: (settings: ResizeSettings) => void;
};

export function SettingsPanel({ settings, onSettingsChange }: SettingsPanelProps) {
  const selectedPreset = imagePresets.find((preset) => preset.id === settings.presetId);
  const targetPixels = getTargetPixels(settings);

  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>Size</h2>
      </div>

      <div className="settings-grid">
        <label>
          <span>Preset</span>
          <select
            value={settings.presetId}
            onChange={(event) => {
              const preset = imagePresets.find((item) => item.id === event.target.value);
              if (!preset) {
                return;
              }
              onSettingsChange({
                ...settings,
                presetId: preset.id,
                widthCm: preset.widthCm,
                heightCm: preset.heightCm,
              });
            }}
          >
            {imagePresets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Width (cm)</span>
          <input
            type="number"
            min={0.1}
            step={0.1}
            value={settings.widthCm}
            onChange={(event) => onSettingsChange({ ...settings, presetId: 'custom', widthCm: Number(event.target.value) || 0.1 })}
          />
        </label>

        <label>
          <span>Height (cm)</span>
          <input
            type="number"
            min={0.1}
            step={0.1}
            value={settings.heightCm}
            onChange={(event) => onSettingsChange({ ...settings, presetId: 'custom', heightCm: Number(event.target.value) || 0.1 })}
          />
        </label>

        <label>
          <span>DPI</span>
          <select value={settings.dpi} onChange={(event) => onSettingsChange({ ...settings, dpi: Number(event.target.value) })}>
            {dpiOptions.map((dpi) => (
              <option key={dpi} value={dpi}>
                {dpi} DPI
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Fit</span>
          <select
            value={settings.fitMode}
            onChange={(event) => onSettingsChange({ ...settings, fitMode: event.target.value as ResizeSettings['fitMode'] })}
          >
            <option value="contain">Contain</option>
            <option value="cover">Cover</option>
          </select>
        </label>

        <label>
          <span>Upscale</span>
          <select
            value={settings.upscaleMode}
            onChange={(event) => onSettingsChange({ ...settings, upscaleMode: event.target.value as ResizeSettings['upscaleMode'] })}
          >
            <option value="off">Off</option>
            <option value="balanced">Balanced</option>
            <option value="detail">Detail</option>
          </select>
        </label>

        <label>
          <span>Format</span>
          <select
            value={settings.outputFormat}
            onChange={(event) => onSettingsChange({ ...settings, outputFormat: event.target.value as ResizeSettings['outputFormat'] })}
          >
            <option value="jpeg">JPEG</option>
            <option value="png">PNG</option>
            <option value="webp">WEBP</option>
          </select>
        </label>

        <label>
          <span>Background</span>
          <input type="color" value={settings.background} onChange={(event) => onSettingsChange({ ...settings, background: event.target.value })} />
        </label>
      </div>

      <div className="enhancements">
        <div className="panel-heading compact">
          <h3>Adjust</h3>
        </div>

        <div className="slider-grid">
          <label>
            <span>Brightness {settings.enhancements.brightness}%</span>
            <input
              type="range"
              min={70}
              max={130}
              value={settings.enhancements.brightness}
              onChange={(event) =>
                onSettingsChange({
                  ...settings,
                  enhancements: { ...settings.enhancements, brightness: Number(event.target.value) },
                })
              }
            />
          </label>

          <label>
            <span>Contrast {settings.enhancements.contrast}%</span>
            <input
              type="range"
              min={70}
              max={140}
              value={settings.enhancements.contrast}
              onChange={(event) =>
                onSettingsChange({
                  ...settings,
                  enhancements: { ...settings.enhancements, contrast: Number(event.target.value) },
                })
              }
            />
          </label>

          <label>
            <span>Saturation {settings.enhancements.saturation}%</span>
            <input
              type="range"
              min={70}
              max={160}
              value={settings.enhancements.saturation}
              onChange={(event) =>
                onSettingsChange({
                  ...settings,
                  enhancements: { ...settings.enhancements, saturation: Number(event.target.value) },
                })
              }
            />
          </label>

          <label>
            <span>Sharpen {settings.enhancements.sharpen}%</span>
            <input
              type="range"
              min={0}
              max={60}
              value={settings.enhancements.sharpen}
              onChange={(event) =>
                onSettingsChange({
                  ...settings,
                  enhancements: { ...settings.enhancements, sharpen: Number(event.target.value) },
                })
              }
            />
          </label>
        </div>

          <label>
            <span>Quality {Math.round(settings.quality * 100)}%</span>
            <input
              type="range"
              min={50}
              max={100}
              value={Math.round(settings.quality * 100)}
              onChange={(event) =>
                onSettingsChange({ ...settings, quality: Number(event.target.value) / 100 })
              }
            />
          </label>

        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.enhancements.autoTone}
            onChange={(event) =>
              onSettingsChange({
                ...settings,
                enhancements: { ...settings.enhancements, autoTone: event.target.checked },
              })
            }
          />
          <span>Auto tone</span>
        </label>
      </div>

      <div className="mini-summary">
        <span>{selectedPreset ? selectedPreset.label : `${formatCentimeters(settings.widthCm)} x ${formatCentimeters(settings.heightCm)} cm`}</span>
        <span>{targetPixels.width} x {targetPixels.height} px</span>
      </div>
    </section>
  );
}
