import type { CSSProperties } from 'react';
import { LOCALE_LABELS, type Locale } from '../i18n/translations';
import { useLanguage } from '../contexts/LanguageContext';

type LanguageSwitcherProps = {
  variant?: 'light' | 'dark';
  className?: string;
};

const LanguageSwitcher = ({ variant = 'dark', className }: LanguageSwitcherProps) => {
  const { locale, setLocale } = useLanguage();

  const isDark = variant === 'dark';
  const baseStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 6px',
    borderRadius: 8,
    border: isDark ? '1px solid rgba(200,145,40,0.25)' : '1px solid #E2E8F0',
    background: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    fontSize: 11,
    fontWeight: 600,
  };

  const btn = (code: Locale) => {
    const active = locale === code;
    return (
      <button
        key={code}
        type="button"
        onClick={() => setLocale(code)}
        title={LOCALE_LABELS[code]}
        style={{
          border: 'none',
          cursor: 'pointer',
          borderRadius: 6,
          padding: '4px 8px',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.04em',
          background: active ? '#C89128' : 'transparent',
          color: active ? '#0F172A' : isDark ? '#94A3B8' : '#64748B',
          transition: 'background 0.15s, color 0.15s',
        }}
      >
        {code.toUpperCase()}
      </button>
    );
  };

  return (
    <div className={className} style={baseStyle} aria-label="Language">
      {btn('en')}
      {btn('sw')}
    </div>
  );
};

export default LanguageSwitcher;
