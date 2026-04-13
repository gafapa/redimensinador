import { dpiOptions, imagePresets } from '../lib/presets';
import { formatCentimeters, getTargetPixels } from '../lib/image-processing';
import { useI18n } from '../lib/i18n';
import type { ResizeSettings } from '../types';

type SettingsPanelProps = {
  settings: ResizeSettings;
  onSettingsChange: (settings: ResizeSettings) => void;
};

export function SettingsPanel({ settings, onSettingsChange }: SettingsPanelProps) {
  const { tr } = useI18n();
  const selectedPreset = imagePresets.find((preset) => preset.id === settings.presetId);
  const targetPixels = getTargetPixels(settings);

  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>{tr.sizeHeading}</h2>
      </div>

      <div className="settings-grid">
        <label>
          <span>{tr.preset}</span>
          <select
            value={settings.presetId}
            onChange={(event) => {
              const preset = imagePresets.find((item) => item.id === event.target.value);
              if (!preset) return;
              onSettingsChange({ ...settings, presetId: preset.id, widthCm: preset.widthCm, heightCm: preset.heightCm });
            }}
          >
            {imagePresets.map((preset) => (
              <option key={preset.id} value={preset.id}>{preset.label}</option>
            ))}
          </select>
        </label>

        <label>
          <span>{tr.widthCm}</span>
          <input
            type="number" min={0.1} step={0.1} value={settings.widthCm}
            onChange={(e) => onSettingsChange({ ...settings, presetId: 'custom', widthCm: Number(e.target.value) || 0.1 })}
          />
        </label>

        <label>
          <span>{tr.heightCm}</span>
          <input
            type="number" min={0.1} step={0.1} value={settings.heightCm}
            onChange={(e) => onSettingsChange({ ...settings, presetId: 'custom', heightCm: Number(e.target.value) || 0.1 })}
          />
        </label>

        <label>
          <span>{tr.dpi}</span>
          <select value={settings.dpi} onChange={(e) => onSettingsChange({ ...settings, dpi: Number(e.target.value) })}>
            {dpiOptions.map((dpi) => (
              <option key={dpi} value={dpi}>{dpi} DPI</option>
            ))}
          </select>
        </label>

        <label>
          <span>{tr.fit}</span>
          <select
            value={settings.fitMode}
            onChange={(e) => onSettingsChange({ ...settings, fitMode: e.target.value as ResizeSettings['fitMode'] })}
          >
            <option value="contain">{tr.contain}</option>
            <option value="cover">{tr.cover}</option>
          </select>
        </label>

        <label>
          <span>{tr.orientation}</span>
          <select
            value={settings.orientationMode}
            onChange={(e) => onSettingsChange({ ...settings, orientationMode: e.target.value as ResizeSettings['orientationMode'] })}
          >
            <option value="fixed">{tr.fixed}</option>
            <option value="auto">{tr.auto}</option>
            <option value="portrait">{tr.portrait}</option>
            <option value="landscape">{tr.landscape}</option>
          </select>
        </label>

        <label>
          <span>{tr.upscale}</span>
          <select
            value={settings.upscaleMode}
            onChange={(e) => onSettingsChange({ ...settings, upscaleMode: e.target.value as ResizeSettings['upscaleMode'] })}
          >
            <option value="off">{tr.off}</option>
            <option value="balanced">{tr.balanced}</option>
            <option value="detail">{tr.detail}</option>
          </select>
        </label>

        <label>
          <span>{tr.format}</span>
          <select
            value={settings.outputFormat}
            onChange={(e) => onSettingsChange({ ...settings, outputFormat: e.target.value as ResizeSettings['outputFormat'] })}
          >
            <option value="jpeg">JPEG</option>
            <option value="png">PNG</option>
            <option value="webp">WEBP</option>
          </select>
        </label>

        <label>
          <span>{tr.background}</span>
          <input type="color" value={settings.background} onChange={(e) => onSettingsChange({ ...settings, background: e.target.value })} />
        </label>
      </div>

      <div className="enhancements">
        <div className="panel-heading compact">
          <h3>{tr.adjustHeading}</h3>
        </div>

        <div className="slider-grid">
          <label>
            <span>{tr.brightness} {settings.enhancements.brightness}%</span>
            <input type="range" min={70} max={130} value={settings.enhancements.brightness}
              onChange={(e) => onSettingsChange({ ...settings, enhancements: { ...settings.enhancements, brightness: Number(e.target.value) } })} />
          </label>

          <label>
            <span>{tr.contrast} {settings.enhancements.contrast}%</span>
            <input type="range" min={70} max={140} value={settings.enhancements.contrast}
              onChange={(e) => onSettingsChange({ ...settings, enhancements: { ...settings.enhancements, contrast: Number(e.target.value) } })} />
          </label>

          <label>
            <span>{tr.saturation} {settings.enhancements.saturation}%</span>
            <input type="range" min={70} max={160} value={settings.enhancements.saturation}
              onChange={(e) => onSettingsChange({ ...settings, enhancements: { ...settings.enhancements, saturation: Number(e.target.value) } })} />
          </label>

          <label>
            <span>{tr.sharpen} {settings.enhancements.sharpen}%</span>
            <input type="range" min={0} max={60} value={settings.enhancements.sharpen}
              onChange={(e) => onSettingsChange({ ...settings, enhancements: { ...settings.enhancements, sharpen: Number(e.target.value) } })} />
          </label>

          <label>
            <span>{tr.quality} {Math.round(settings.quality * 100)}%</span>
            <input type="range" min={50} max={100} value={Math.round(settings.quality * 100)}
              onChange={(e) => onSettingsChange({ ...settings, quality: Number(e.target.value) / 100 })} />
          </label>
        </div>

        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.enhancements.autoTone}
            onChange={(e) => onSettingsChange({ ...settings, enhancements: { ...settings.enhancements, autoTone: e.target.checked } })}
          />
          <span>{tr.autoTone}</span>
        </label>
      </div>

      <div className="mini-summary">
        <span>{selectedPreset ? selectedPreset.label : `${formatCentimeters(settings.widthCm)} × ${formatCentimeters(settings.heightCm)} cm`}</span>
        <span>{targetPixels.width} × {targetPixels.height} px</span>
      </div>
    </section>
  );
}
