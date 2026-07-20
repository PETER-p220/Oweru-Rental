import phrasesSw from './phrases.sw.json';
import { commonEn, commonSw } from './modules/common';
import { rolesEn, rolesSw, sidebarEn, sidebarSw } from './modules/sidebar';
import { agentEn, agentSw } from './modules/agent';

export type Locale = 'en' | 'sw';

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  sw: 'Kiswahili',
};

function flattenStrings(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, val] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof val === 'string') out[path] = val;
    else if (val && typeof val === 'object') Object.assign(out, flattenStrings(val as Record<string, unknown>, path));
  }
  return out;
}

const en = {
  nav: {
    home: 'Home',
    properties: 'Properties',
    about: 'About',
    contact: 'Contact',
    dashboard: 'Dashboard',
    messages: 'Messages',
    notifications: 'Notifications',
    settings: 'Settings',
    signOut: 'Sign out',
    login: 'Login',
    register: 'Register',
  },
  common: commonEn,
  sidebar: sidebarEn,
  roles: rolesEn,
  agent: agentEn,
};

const sw = {
  nav: {
    home: 'Nyumbani',
    properties: 'Nyumba',
    about: 'Kuhusu',
    contact: 'Wasiliana',
    dashboard: 'Dashibodi',
    messages: 'Ujumbe',
    notifications: 'Arifa',
    settings: 'Mipangilio',
    signOut: 'Toka',
    login: 'Ingia',
    register: 'Jisajili',
  },
  common: commonSw,
  sidebar: sidebarSw,
  roles: rolesSw,
  agent: agentSw,
};

export const translations: Record<Locale, typeof en> = { en, sw };

export type TranslationTree = typeof en;

/** English UI text → Swahili (structured tree + generated phrases + sidebar value map). */
export function buildEnglishToSwahiliMap(): Record<string, string> {
  const map: Record<string, string> = { ...(phrasesSw as Record<string, string>) };

  const enFlat = flattenStrings(en as unknown as Record<string, unknown>);
  const swFlat = flattenStrings(sw as unknown as Record<string, unknown>);
  for (const key of Object.keys(enFlat)) {
    if (swFlat[key]) map[enFlat[key]] = swFlat[key];
  }

  for (const [k, v] of Object.entries(sidebarEn)) {
    map[v] = sidebarSw[k as keyof typeof sidebarSw];
  }
  for (const [k, v] of Object.entries(rolesEn)) {
    map[v] = rolesSw[k as keyof typeof rolesSw];
  }
  for (const [k, v] of Object.entries(commonEn)) {
    map[v] = commonSw[k as keyof typeof commonSw];
  }

  return map;
}
