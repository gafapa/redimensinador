import { SettingsPanel } from './SettingsPanel';
import { LangSelector } from './LangSelector';
import { AppIcon } from './AppIcon';
import { useI18n } from '../lib/i18n';
import type { ResizeSettings } from '../types';

type ConfigViewProps = {
  settings: ResizeSettings;
  onSettingsChange: (settings: ResizeSettings) => void;
  onBack: () => void;
};

export function ConfigView({ settings, onSettingsChange, onBack }: ConfigViewProps) {
  const { tr } = useI18n();
  return (
    <div className="view-shell">
      <header className="view-header">
        <div className="view-header__left">
          <button type="button" className="secondary-button" onClick={onBack}>
            {tr.back}
          </button>
          <AppIcon />
          <h1 className="view-header__title">{tr.settings}</h1>
        </div>
        <div className="view-header__right">
          <LangSelector />
        </div>
      </header>
      <div className="view-body">
        <SettingsPanel settings={settings} onSettingsChange={onSettingsChange} />
      </div>
    </div>
  );
}
