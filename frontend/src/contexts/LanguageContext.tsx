import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { buildEnglishToSwahiliMap, translations, type Locale, type TranslationTree } from '../i18n/translations';

const STORAGE_KEY = 'oweru_locale';

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  /** Translate raw English UI copy (used across legacy pages). */
  tx: (text: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function resolveKey(tree: TranslationTree, key: string): string {
  const parts = key.split('.');
  let node: unknown = tree;
  for (const part of parts) {
    if (node == null || typeof node !== 'object' || !(part in (node as object))) {
      return key;
    }
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string' ? node : key;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'sw' || stored === 'en' ? stored : 'en';
  });

  const phraseMap = useMemo(() => buildEnglishToSwahiliMap(), []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next === 'sw' ? 'sw' : 'en';
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === 'sw' ? 'sw' : 'en';
  }, [locale]);

  const t = useCallback(
    (key: string) => resolveKey(translations[locale], key),
    [locale],
  );

  const tx = useCallback(
    (text: string) => {
      if (!text || locale === 'en') return text;
      const trimmed = text.trim();
      return phraseMap[text] ?? phraseMap[trimmed] ?? text;
    },
    [locale, phraseMap],
  );

  const value = useMemo(() => ({ locale, setLocale, t, tx }), [locale, setLocale, t, tx]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return ctx;
}

/** Shorthand for translating inline English copy. */
export function useTx() {
  return useLanguage().tx;
}
