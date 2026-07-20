import type { ReactNode } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

/** Translate a short English string for display (legacy pages). */
export function T({ children }: { children: string }) {
  const { tx } = useLanguage();
  return <>{tx(children)}</>;
}

export function Tx({ children }: { children: ReactNode }) {
  const { tx } = useLanguage();
  if (typeof children === 'string') return <>{tx(children)}</>;
  return <>{children}</>;
}
