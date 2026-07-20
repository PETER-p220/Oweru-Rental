import fs from 'fs';
import path from 'path';
import { translate as googleTranslate } from '@vitalets/google-translate-api';

const strings = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'scripts', 'clean-strings.json'), 'utf8'),
);

const outPath = path.join(process.cwd(), 'src', 'i18n', 'phrases.sw.json');
let existing = {};
if (fs.existsSync(outPath)) {
  existing = JSON.parse(fs.readFileSync(outPath, 'utf8'));
}

const args = process.argv.slice(2);
const slowMode = args.includes('--slow');
const maxArg = args.find((a) => a.startsWith('--max='));
const maxToProcess = maxArg ? Number(maxArg.split('=')[1]) : Infinity;

const DELAY_MS = slowMode ? 8000 : 4500;
const MAX_CONSECUTIVE_FAILURES = 6;

function shouldSkip(s) {
  if (s.length < 2) return true;
  if (/^[\d\s.+()-]+$/.test(s)) return true;
  if (s.includes('useState') || s.includes('=>')) return true;
  if (/^0\s/.test(s)) return true;
  if (s === '0' || s === '0.00') return true;
  return false;
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

function isRateLimitError(err) {
  const msg = String(err?.message || err || '').toLowerCase();
  return msg.includes('too many requests') || msg.includes('429');
}

async function translateMyMemory(text) {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|sw`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`MyMemory HTTP ${res.status}`);
  const data = await res.json();
  if (data.responseStatus !== 200) {
    throw new Error(data.responseDetails || 'MyMemory rejected request');
  }
  const out = data.responseData?.translatedText?.trim();
  if (!out || out.toUpperCase() === text.toUpperCase()) {
    throw new Error('MyMemory returned empty or unchanged text');
  }
  return out;
}

async function translateOne(en) {
  let lastErr;
  try {
    const res = await googleTranslate(en, { from: 'en', to: 'sw' });
    const text = res.text.trim();
    if (text && text !== en) return text;
  } catch (err) {
    lastErr = err;
    if (!isRateLimitError(err)) {
      /* try fallback */
    }
  }
  try {
    return await translateMyMemory(en);
  } catch (err) {
    if (lastErr && isRateLimitError(lastErr)) throw lastErr;
    throw err;
  }
}

function isSoftSkip(err) {
  const msg = String(err?.message || '');
  return msg.includes('unchanged') || msg.includes('empty');
}

const pending = strings.filter((s) => !shouldSkip(s) && (!existing[s] || existing[s] === s));
const queue = pending.slice(0, Number.isFinite(maxToProcess) ? maxToProcess : pending.length);

console.error(
  `Pending: ${pending.length} | This run: ${queue.length} | Delay: ${DELAY_MS}ms${slowMode ? ' (slow)' : ''}`,
);
console.error('Tip: if rate-limited, wait 1–2 hours and re-run, or use: npm run i18n:generate -- --slow --max=50');

let consecutiveRateLimits = 0;
let translated = 0;
let softSkips = 0;

for (let i = 0; i < queue.length; i++) {
  const en = queue[i];
  try {
    const sw = await translateOne(en);
    if (sw && sw !== en) {
      existing[en] = sw;
      translated++;
      consecutiveRateLimits = 0;
      fs.writeFileSync(outPath, JSON.stringify(existing, null, 2));
      console.error(`OK ${i + 1}/${queue.length} (session +${translated})`);
    } else {
      softSkips++;
      console.error(`No change ${i + 1}/${queue.length}: "${en.slice(0, 50)}${en.length > 50 ? '…' : ''}"`);
    }
  } catch (err) {
    if (isSoftSkip(err)) {
      softSkips++;
      console.error(`Soft skip ${i + 1}/${queue.length}: ${err.message}`);
    } else if (isRateLimitError(err)) {
      consecutiveRateLimits++;
      console.error(`Rate limit ${i + 1}/${queue.length}: wait and retry later`);
      if (consecutiveRateLimits >= MAX_CONSECUTIVE_FAILURES) {
        console.error(
          `\nStopped after ${MAX_CONSECUTIVE_FAILURES} rate-limit errors from Google.`,
        );
        console.error('Progress saved. Retry in 1–2 hours: npm run i18n:generate:slow');
        break;
      }
    } else {
      softSkips++;
      console.error(`Skip ${i + 1}/${queue.length}: ${err.message}`);
    }
  }
  await delay(DELAY_MS);
}

const total = Object.keys(existing).length;
const keys = Object.keys(existing);
const swCount = keys.filter((k) => existing[k] !== k).length;

console.error(
  `Done. +${translated} this run, ${softSkips} soft skips. File: ${total} entries, ~${swCount} Swahili, ~${total - swCount} English.`,
);
