import { dpiOptions, imagePresets } from '../lib/presets';
import type { ResizeSettings } from '../types';

type SettingsPanelProps = {
  settings: ResizeSettings;
  onSettingsChange: (settings: ResizeSettings) => void;
};

export function SettingsPanel({ settings, onSettingsChange }: SettingsPanelProps) {
  const selectedPreset = imagePresets.find((preset) => preset.id === settings.presetId);

  return (
    <section className="panel">
      <div className="panel-heading">
        <span className="eyebrow">Output</span>
        <h2>Target size and enhancements</h2>
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
                width: preset.width,
                height: preset.height,
                dpi: preset.category === 'print' ? 300 : settings.dpi,
              });
            }}
          >
            {imagePresets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label} · {preset.width}×{preset.height}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Width</span>
          <input
            type="number"
            min={1}
            value={settings.width}
            onChange={(event) => onSettingsChange({ ...settings, presetId: 'custom', width: Number(event.target.value) || 1 })}
          />
        </label>

        <label>
          <span>Height</span>
          <input
            type="number"
            min={1}
            value={settings.height}
            onChange={(event) => onSettingsChange({ ...settings, presetId: 'custom', height: Number(event.target.value) || 1 })}
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
          <span>Fit mode</span>
          <select
            value={settings.fitMode}
            onChange={(event) => onSettingsChange({ ...settings, fitMode: event.target.value as ResizeSettings['fitMode'] })}
          >
            <option value="contain">Contain inside frame</option>
            <option value="cover">Cover and crop</option>
          </select>
        </label>

        <label>
          <span>Upscaling</span>
          <select
            value={settings.upscaleMode}
            onChange={(event) => onSettingsChange({ ...settings, upscaleMode: event.target.value as ResizeSettings['upscaleMode'] })}
          >
            <option value="off">Off</option>
            <option value="balanced">Balanced upscale</option>
            <option value="detail">Detail boost</option>
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
          <h3>Image improvements</h3>
          <p>Simple browser-side corrections for contrast, tone and presence.</p>
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
          <span>Auto tone stretch</span>
        </label>
      </div>

      <p className="meta-note">
        {selectedPreset ? `${selectedPreset.label} selected.` : 'Custom size selected.'} Browser exports do not reliably embed
        print DPI metadata in every format, so DPI is used for the output plan and file naming.
      </p>
    </section>
  );
}
