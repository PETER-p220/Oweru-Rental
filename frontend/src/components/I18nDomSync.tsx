import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'CODE', 'PRE', 'TEXTAREA']);

function restoreTree(root: HTMLElement) {
  root.querySelectorAll('[data-i18n-original-text]').forEach((el) => {
    const original = el.getAttribute('data-i18n-original-text');
    if (original != null) el.textContent = original;
    el.removeAttribute('data-i18n-original-text');
  });

  root.querySelectorAll('[data-i18n-original-placeholder]').forEach((el) => {
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      const original = el.getAttribute('data-i18n-original-placeholder');
      if (original != null) el.placeholder = original;
      el.removeAttribute('data-i18n-original-placeholder');
    }
  });

  root.querySelectorAll('[data-i18n-original-title]').forEach((el) => {
    const original = el.getAttribute('data-i18n-original-title');
    if (original != null) el.setAttribute('title', original);
    el.removeAttribute('data-i18n-original-title');
  });

  root.querySelectorAll('[data-i18n-original-aria]').forEach((el) => {
    const original = el.getAttribute('data-i18n-original-aria');
    if (original != null) el.setAttribute('aria-label', original);
    el.removeAttribute('data-i18n-original-aria');
  });
}

function translateTree(root: HTMLElement, tx: (s: string) => string) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Node | null = walker.nextNode();
  while (node) {
    const raw = node.textContent ?? '';
    const trimmed = raw.trim();
    if (trimmed.length >= 2) {
      const parent = node.parentElement;
      if (parent && !SKIP_TAGS.has(parent.tagName)) {
        const translated = tx(trimmed);
        if (translated !== trimmed) {
          if (!parent.hasAttribute('data-i18n-original-text')) {
            parent.setAttribute('data-i18n-original-text', parent.textContent ?? trimmed);
          }
          node.textContent = raw.replace(trimmed, translated);
        }
      }
    }
    node = walker.nextNode();
  }

  root.querySelectorAll('input[placeholder], textarea[placeholder]').forEach((el) => {
    if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return;
    const ph = el.placeholder;
    if (!ph) return;
    const translated = tx(ph);
    if (translated !== ph) {
      if (!el.hasAttribute('data-i18n-original-placeholder')) {
        el.setAttribute('data-i18n-original-placeholder', ph);
      }
      el.placeholder = translated;
    }
  });

  root.querySelectorAll('[title]').forEach((el) => {
    const title = el.getAttribute('title');
    if (!title) return;
    const translated = tx(title);
    if (translated !== title) {
      if (!el.hasAttribute('data-i18n-original-title')) {
        el.setAttribute('data-i18n-original-title', title);
      }
      el.setAttribute('title', translated);
    }
  });

  root.querySelectorAll('[aria-label]').forEach((el) => {
    const label = el.getAttribute('aria-label');
    if (!label) return;
    const translated = tx(label);
    if (translated !== label) {
      if (!el.hasAttribute('data-i18n-original-aria')) {
        el.setAttribute('data-i18n-original-aria', label);
      }
      el.setAttribute('aria-label', translated);
    }
  });
}

function syncDom(locale: string, tx: (s: string) => string) {
  const root = document.getElementById('root');
  if (!root) return;

  restoreTree(root);
  if (locale === 'sw') {
    translateTree(root, tx);
  }
}

/** Applies Swahili phrase map to static DOM text after navigation and async loads. */
const I18nDomSync = () => {
  const { locale, tx } = useLanguage();
  const { pathname } = useLocation();

  useEffect(() => {
    syncDom(locale, tx);
    const t1 = window.setTimeout(() => syncDom(locale, tx), 120);
    const t2 = window.setTimeout(() => syncDom(locale, tx), 450);
    const t3 = window.setTimeout(() => syncDom(locale, tx), 1200);

    const root = document.getElementById('root');
    let debounce: ReturnType<typeof setTimeout> | undefined;
    const observer =
      root && locale === 'sw'
        ? new MutationObserver(() => {
            clearTimeout(debounce);
            debounce = setTimeout(() => syncDom(locale, tx), 150);
          })
        : null;
    if (root && observer) {
      observer.observe(root, { childList: true, subtree: true, characterData: true });
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(debounce);
      observer?.disconnect();
    };
  }, [locale, pathname, tx]);

  return null;
};

export default I18nDomSync;
