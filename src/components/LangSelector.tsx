import { LANGUAGES, useI18n, type Lang } from '../lib/i18n';

export function LangSelector() {
  const { lang, setLang } = useI18n();
  return (
    <select
      className="lang-select"
      value={lang}
      onChange={(e) => setLang(e.target.value as Lang)}
      aria-label="Language"
    >
      {LANGUAGES.map((l) => (
        <option key={l.code} value={l.code}>
          {l.label}
        </option>
      ))}
    </select>
  );
}
