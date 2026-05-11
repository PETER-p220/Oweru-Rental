import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, MapPin, Bed, Bath, Square, Share2,
  SlidersHorizontal, X, ChevronDown, LayoutGrid, List,
  CreditCard, LogIn, UserPlus, ShieldCheck, CheckCircle2,
  ArrowRight, Loader2, AlertCircle, Info, CheckCheck, Sparkles,
  Bookmark, ChevronLeft, ChevronRight, Building2, Home, Users,
} from 'lucide-react';
import Api from '../services/api';
import SelcomService from '../services/selcom';

/* ─── Types ─── */
interface Pagination { current_page: number; last_page: number; per_page: number; total: number; }
interface Property {
  id: number; title: string; location?: string; address?: string;
  price: number | null | undefined; bedrooms?: number; bathrooms?: number; size?: number; area?: number;
  type?: string; featured?: boolean; furnished?: boolean; description?: string;
  images?: string[];
  property_images?: { image_path: string; is_primary?: boolean }[];
  owner?: { id?: number; name?: string; first_name?: string; last_name?: string };
  agent?: { id?: number; name?: string; code?: string };
  dalali?: string;
  owner_id?: number;
  agent_id?: number;
}

type ToastType = 'success' | 'error' | 'info' | 'warning';
interface Toast { id: string; type: ToastType; title: string; message?: string; duration?: number; }

function useDebounce<T>(value: T, delay: number): T {
  const [d, setD] = useState(value);
  useEffect(() => { const t = setTimeout(() => setD(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return d;
}

const VITE_STORAGE = import.meta.env.VITE_API_URL?.replace('/api', '') ?? '';
const ITEMS_PER_PAGE = 12;

const formatPrice = (p: number | null | undefined): string => {
  if (p == null || isNaN(Number(p))) return 'Price on request';
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency', currency: 'TZS',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(Number(p));
};

const typeLabel: Record<string, string> = {
  house: 'House',
  'Master-bedroom': 'Master-bedroom',
  'Single-room': 'Single room',
  apartment: 'Apartment',
  villa: 'Villa',
  studio: 'Studio',
  commercial: 'Commercial',
  oweru_rental: 'Oweru Rental',
};

const PLACEHOLDER = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='450' viewBox='0 0 600 450'%3E%3Crect width='600' height='450' fill='%231E2D4A'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Georgia' font-size='18' fill='%23C89128'%3ENo Image%3C/text%3E%3C/svg%3E`;

// ── Universal image resolver ─────────────────────────────────────────────────
// Tries every shape the backend may return:
//   1. property_images[] snake_case  (public API after fix)
//   2. propertyImages[]  camelCase   (commercial API)
//   3. images[]          JSON column (agent-created properties)
const getImage = (property: any): string => {
  const si = property?.property_images;
  if (Array.isArray(si) && si.length > 0) {
    const p = si.find((i: any) => i.is_primary) ?? si[0];
    const path = p?.image_path ?? p?.url ?? '';
    if (path) return resolveUrl(path);
  }
  const ci = property?.propertyImages;
  if (Array.isArray(ci) && ci.length > 0) {
    const p = ci.find((i: any) => i.is_primary) ?? ci[0];
    const path = p?.image_path ?? p?.url ?? '';
    if (path) return resolveUrl(path);
  }
  const imgs = property?.images;
  if (Array.isArray(imgs) && imgs.length > 0) {
    const first = imgs[0];
    const path = typeof first === 'string' ? first : (first?.image_path ?? first?.url ?? '');
    if (path) return resolveUrl(path);
  }
  return PLACEHOLDER;
};

const resolveUrl = (path: string): string => {
  if (!path || !path.trim()) return PLACEHOLDER;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/storage/'))  return `${VITE_STORAGE}${path}`;
  if (path.startsWith('storage/'))   return `${VITE_STORAGE}/${path}`;
  if (path.startsWith('/'))          return `${VITE_STORAGE}${path}`;
  return `${VITE_STORAGE}/storage/${path}`;
};

const getImageSrcSet = (property: any): string => {
  const getImagePath = (): string => {
    const si = property?.property_images;
    if (Array.isArray(si) && si.length > 0) {
      const p = si.find((i: any) => i.is_primary) ?? si[0];
      return p?.image_path ?? p?.url ?? '';
    }
    const ci = property?.propertyImages;
    if (Array.isArray(ci) && ci.length > 0) {
      const p = ci.find((i: any) => i.is_primary) ?? ci[0];
      return p?.image_path ?? p?.url ?? '';
    }
    const imgs = property?.images;
    if (Array.isArray(imgs) && imgs.length > 0) {
      const first = imgs[0];
      return typeof first === 'string' ? first : (first?.image_path ?? first?.url ?? '');
    }
    return '';
  };
  
  const path = getImagePath();
  if (!path) return '';
  
  const base = resolveUrl(path);
  return `${base}?w=400 400w, ${base}?w=800 800w, ${base}?w=1200 1200w`;
};

const COMMERCIAL_TYPES = ['office', 'retail', 'warehouse', 'commercial', 'industrial'];

const getListingSource = (p: Property): 'agent' | 'landlord' | 'admin' | 'commercial_admin' => {
  if (p.agent_id) return 'agent';
  if (p.type === 'oweru_rental') return 'admin';
  if (p.type && COMMERCIAL_TYPES.includes(p.type.toLowerCase())) return 'commercial_admin';
  if (p.owner_id) return 'landlord';
  return 'landlord';
};

const sourceLabel: Record<string, string> = {
  agent: 'Agent', landlord: 'Landlord', admin: 'Oweru Rental', commercial_admin: 'Commercial',
};

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '...')[] = [1];
  if (current > 3) pages.push('...');
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push('...');
  pages.push(total);
  return pages;
}

/* ─────────────────────────────────────────────────────────────────
   CSS — Home.jsx palette:
   navy-900 #0F172A · navy-800 #162035 · navy-700 #1E2D4A
   gold #C89128 · gold-lt #D4A843 · gold-dim rgba(200,145,40,.12)
   cream #F8F8F9 · slate #94A3B8 · border rgba(200,145,40,.18)
───────────────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --navy-900:#0F172A;
  --navy-800:#162035;
  --navy-700:#1E2D4A;
  --gold:#C89128;
  --gold-lt:#D4A843;
  --gold-dim:rgba(200,145,40,0.12);
  --gold-border:rgba(200,145,40,0.18);
  --gold-border-hover:rgba(200,145,40,0.45);
  --cream:#F8F8F9;
  --slate:#94A3B8;
  --border:rgba(200,145,40,0.18);
  --success:#10b981;
  --danger:#ef4444;
  --warning:#f59e0b;
  --info:#3b82f6;
  --sans:'Jost',system-ui,sans-serif;
  --serif:'Playfair Display',Georgia,serif;
  --r:12px;--r-sm:8px;--r-xs:6px;
}

/* ── Page Header ── */
.ph{background:var(--navy-900);border-bottom:1px solid var(--border);}
.ph-inner{
  max-width:1280px;margin:0 auto;
  padding:52px 40px 44px;
  display:flex;align-items:flex-end;justify-content:space-between;gap:20px;flex-wrap:wrap;
}
.ph-eyebrow{
  font-family:var(--sans);font-size:10px;font-weight:600;
  letter-spacing:.22em;text-transform:uppercase;
  color:var(--gold);margin-bottom:10px;
  display:inline-flex;align-items:center;gap:10px;
  background:var(--gold-dim);border:1px solid var(--border);
  padding:4px 12px;
}
.ph-title{
  font-family:var(--serif);font-size:clamp(28px,4vw,48px);
  font-weight:300;line-height:1.08;letter-spacing:-.02em;color:var(--cream);
}
.ph-title em{font-style:italic;color:var(--gold);}
.ph-meta{font-family:var(--sans);font-size:13px;font-weight:300;color:var(--slate);text-align:right;}
.ph-meta strong{color:var(--gold);font-weight:500;}
.ph-source-pills{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;}
.ph-pill{
  font-family:var(--sans);font-size:10px;font-weight:600;
  letter-spacing:.1em;text-transform:uppercase;
  padding:4px 12px;border-radius:20px;
}
.ph-pill-agent{background:var(--gold-dim);color:var(--gold);border:1px solid var(--border);}
.ph-pill-landlord{background:rgba(248,248,249,.08);color:rgba(248,248,249,.65);border:1px solid rgba(248,248,249,.12);}
.ph-pill-admin{background:rgba(16,185,129,.12);color:#34d399;border:1px solid rgba(16,185,129,.25);}

/* ── Search Bar ── */
.sb{background:var(--navy-800);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:50;box-shadow:0 4px 24px rgba(0,0,0,.3);}
.sb-inner{max-width:1280px;margin:0 auto;padding:12px 40px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.sb-search{
  flex:1;min-width:180px;display:flex;align-items:center;
  background:var(--navy-700);border:1px solid var(--border);
  border-radius:var(--r-sm);overflow:hidden;transition:border-color .18s;
}
.sb-search:focus-within{border-color:var(--gold);}
.sb-search-icon{padding:0 10px;color:var(--slate);display:flex;align-items:center;flex-shrink:0;}
.sb-input{
  flex:1;background:transparent;border:none;outline:none;
  color:var(--cream);font-family:var(--sans);font-size:13px;padding:9px 10px 9px 0;
}
.sb-input::placeholder{color:var(--slate);}
.sb-clear{background:none;border:none;color:var(--slate);cursor:pointer;padding:0 10px;display:flex;align-items:center;transition:color .15s;}
.sb-clear:hover{color:var(--cream);}
.sb-select{
  background:var(--navy-700);border:1px solid var(--border);
  border-radius:var(--r-sm);color:var(--slate);
  padding:9px 12px;font-family:var(--sans);font-size:13px;
  outline:none;cursor:pointer;transition:border-color .18s;min-width:120px;
}
.sb-select option{background:var(--navy-800);color:var(--cream);}
.sb-select:focus{border-color:var(--gold);color:var(--cream);}

/* ── Source Filter Tabs ── */
.source-tabs{display:flex;gap:4px;flex-wrap:wrap;flex-shrink:0;}
.source-tab{
  display:flex;align-items:center;gap:5px;padding:7px 10px;border-radius:var(--r-sm);
  font-family:var(--sans);font-size:11px;font-weight:600;
  border:1px solid var(--border);background:var(--navy-700);
  color:var(--slate);cursor:pointer;white-space:nowrap;transition:all .18s;
}
.source-tab:hover:not(.active):not(.active-agent):not(.active-admin){
  border-color:var(--gold-border-hover);color:var(--cream);background:var(--gold-dim);
}
.source-tab.active{background:var(--navy-700);border-color:var(--gold);color:var(--cream);}
.source-tab.active-agent{background:var(--gold);border-color:var(--gold);color:var(--navy-900);}
.source-tab.active-admin{background:#0f6e56;border-color:#0f6e56;color:#fff;}

.sb-filter-btn{
  display:flex;align-items:center;gap:6px;
  background:var(--navy-700);border:1px solid var(--border);
  border-radius:var(--r-sm);color:var(--slate);
  padding:9px 14px;font-family:var(--sans);font-size:13px;
  cursor:pointer;white-space:nowrap;transition:all .18s;
}
.sb-filter-btn:hover,.sb-filter-btn.active{border-color:var(--gold);color:var(--cream);background:var(--gold-dim);}
.sb-filter-count{
  background:var(--gold);color:var(--navy-900);
  width:16px;height:16px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  font-size:9px;font-weight:700;
}
.sb-view-btns{display:flex;gap:4px;flex-shrink:0;}
.sb-view-btn{
  width:34px;height:34px;background:var(--navy-700);border:1px solid var(--border);
  border-radius:var(--r-sm);color:var(--slate);
  display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .18s;
}
.sb-view-btn.active{background:var(--gold);border-color:var(--gold);color:var(--navy-900);}
.sb-view-btn:hover:not(.active){border-color:var(--gold-border-hover);color:var(--cream);}

/* ── Adv Filters ── */
.adv{background:var(--navy-800);border-bottom:1px solid var(--border);max-height:0;overflow:hidden;transition:max-height .3s ease;}
.adv.open{max-height:100px;}
.adv-inner{max-width:1280px;margin:0 auto;padding:12px 40px 16px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.adv-label{
  font-family:var(--sans);font-size:10px;font-weight:600;
  letter-spacing:.18em;text-transform:uppercase;color:var(--slate);margin-right:4px;flex-shrink:0;
}
.adv-clear{
  display:flex;align-items:center;gap:5px;background:transparent;
  border:1px solid var(--border);border-radius:var(--r-sm);
  color:var(--slate);padding:7px 12px;font-family:var(--sans);font-size:12px;
  cursor:pointer;transition:all .18s;margin-left:auto;
}
.adv-clear:hover{color:var(--danger);border-color:var(--danger);}

/* ── Body / Grid ── */
.pr-body{max-width:1280px;margin:0 auto;padding:36px 40px 48px;}
.pr-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;}
.pr-grid.list{grid-template-columns:minmax(0,1fr);}

/* ── Property Card ── */
.pc{
  background:var(--navy-800);border:1px solid var(--border);
  border-radius:var(--r);overflow:hidden;
  transition:box-shadow .22s,transform .22s,border-color .22s;
  display:flex;flex-direction:column;text-decoration:none;color:inherit;
}
.pc:hover{box-shadow:0 12px 40px rgba(0,0,0,.4);transform:translateY(-4px);border-color:var(--gold-border-hover);}
.pr-grid.list .pc{flex-direction:row;}
.pc-img-wrap{position:relative;overflow:hidden;aspect-ratio:4/3;flex-shrink:0;}
.pr-grid.list .pc-img-wrap{width:240px;aspect-ratio:auto;}
.pc-img{width:100%;height:100%;object-fit:cover;transition:transform .4s ease;background:var(--navy-700);}
.pc:hover .pc-img{transform:scale(1.04);}
.pc-img-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(9,15,29,.7) 0%,transparent 55%);}
.pc-badge-featured{
  position:absolute;top:12px;left:12px;
  background:var(--gold);color:var(--navy-900);
  font-family:var(--sans);font-size:9px;font-weight:700;
  letter-spacing:.14em;text-transform:uppercase;padding:4px 10px;border-radius:4px;
}
.pc-badge-type{
  position:absolute;bottom:12px;left:12px;
  background:rgba(15,23,42,.85);color:var(--cream);
  font-family:var(--sans);font-size:9px;font-weight:600;
  letter-spacing:.14em;text-transform:uppercase;padding:4px 10px;border-radius:4px;
  backdrop-filter:blur(6px);
}
.pc-badge-source{position:absolute;top:12px;right:12px;font-family:var(--sans);font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:4px 10px;border-radius:4px;}
.pc-badge-source.agent{background:rgba(200,145,40,.9);color:var(--navy-900);}
.pc-badge-source.landlord{background:rgba(15,23,42,.85);color:var(--cream);backdrop-filter:blur(6px);}
.pc-badge-source.admin{background:rgba(15,110,86,.9);color:#fff;}
.pc-badge-source.commercial_admin{background:rgba(139,92,246,.9);color:#fff;}
.pc-price-overlay{position:absolute;bottom:12px;right:12px;text-align:right;}
.pc-price-main{font-family:var(--serif);font-size:18px;font-weight:400;color:var(--cream);letter-spacing:-.01em;}
.pc-price-period{font-family:var(--sans);font-size:10px;color:rgba(248,248,249,.5);}
.pc-img-actions{position:absolute;top:12px;right:50px;display:flex;flex-direction:column;gap:4px;opacity:0;transition:opacity .22s;}
.pc:hover .pc-img-actions{opacity:1;}
.pc-img-btn{
  width:30px;height:30px;background:rgba(15,23,42,.8);border:1px solid var(--border);
  border-radius:6px;color:var(--slate);display:flex;align-items:center;justify-content:center;
  cursor:pointer;transition:all .15s;
}
.pc-img-btn:hover{color:var(--gold);border-color:var(--gold);}
.pc-body{padding:16px 18px 18px;display:flex;flex-direction:column;flex:1;}
.pc-location{display:flex;align-items:center;gap:4px;font-family:var(--sans);font-size:11px;letter-spacing:.06em;color:var(--slate);margin-bottom:6px;}
.pc-location svg{color:var(--gold);}
.pc-title{font-family:var(--serif);font-size:17px;font-weight:400;color:var(--cream);letter-spacing:-.01em;line-height:1.3;margin-bottom:4px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.pc-desc{font-family:var(--sans);font-size:12px;font-weight:300;line-height:1.65;color:var(--slate);margin-bottom:12px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.pc-specs{display:flex;align-items:center;gap:10px;padding:10px 0;margin:auto 0 12px;border-top:1px solid var(--border);border-bottom:1px solid var(--border);}
.pc-spec{display:flex;align-items:center;gap:5px;font-family:var(--sans);font-size:12px;color:var(--slate);}
.pc-spec svg{color:var(--gold);opacity:.9;}
.pc-spec-div{width:1px;height:12px;background:var(--border);}
.pc-footer{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;}
.pc-foot-actions{display:flex;align-items:center;gap:6px;}
.pc-save-btn{
  height:30px;border-radius:6px;border:1px solid var(--border);background:transparent;
  color:var(--slate);display:inline-flex;align-items:center;justify-content:center;
  gap:5px;cursor:pointer;transition:all .18s;padding:0 10px;
  font-family:var(--sans);font-size:12px;font-weight:600;white-space:nowrap;
}
.pc-save-btn:hover{border-color:var(--gold);color:var(--gold);background:var(--gold-dim);}
.pc-save-btn.saved{color:var(--navy-900);border-color:var(--gold);background:var(--gold);}
.pc-save-btn.saved:hover{background:var(--gold-lt);border-color:var(--gold-lt);}
.pc-foot-btn{
  height:30px;border-radius:6px;border:1px solid var(--border);background:transparent;
  color:var(--slate);display:flex;align-items:center;justify-content:center;
  cursor:pointer;transition:all .15s;padding:0 8px;
}
.pc-foot-btn:hover{border-color:var(--gold-border-hover);color:var(--cream);}
.pc-foot-btn.apply{
  background:var(--gold);border-color:var(--gold);color:var(--navy-900);
  padding:0 14px;font-family:var(--sans);font-size:12px;font-weight:700;letter-spacing:.04em;
}
.pc-foot-btn.apply:hover{background:var(--gold-lt);border-color:var(--gold-lt);}
.pc-tag{
  font-family:var(--sans);font-size:10px;font-weight:600;letter-spacing:.1em;
  text-transform:uppercase;color:var(--gold);background:var(--gold-dim);
  border:1px solid var(--border);padding:3px 8px;border-radius:4px;
}

/* ── Skeleton ── */
.skel{background:var(--navy-800);border:1px solid var(--border);border-radius:var(--r);overflow:hidden;}
.skel-pulse{background:linear-gradient(90deg,var(--navy-800) 25%,var(--navy-700) 50%,var(--navy-800) 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}

/* ── Empty / Error ── */
.pr-empty{
  grid-column:1/-1;display:flex;flex-direction:column;align-items:center;
  padding:80px 40px;text-align:center;
  background:var(--navy-800);border:1px solid var(--border);border-radius:var(--r);
}
.pr-empty-icon{
  width:60px;height:60px;border-radius:16px;
  background:var(--gold-dim);border:1px solid var(--border);
  display:flex;align-items:center;justify-content:center;color:var(--gold);margin-bottom:20px;
}
.pr-empty-title{font-family:var(--serif);font-size:24px;font-weight:300;color:var(--cream);margin-bottom:6px;}
.pr-empty-desc{font-family:var(--sans);font-size:14px;font-weight:300;color:var(--slate);margin-bottom:24px;}
.pr-empty-btn{
  display:inline-flex;align-items:center;gap:6px;background:transparent;
  border:1px solid var(--border);border-radius:var(--r-sm);color:var(--slate);
  padding:9px 18px;font-family:var(--sans);font-size:13px;cursor:pointer;transition:all .18s;
}
.pr-empty-btn:hover{border-color:var(--gold);color:var(--gold);background:var(--gold-dim);}
.err-banner{
  background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.25);border-radius:var(--r-sm);
  padding:12px 16px;margin-bottom:24px;font-family:var(--sans);font-size:13px;color:var(--danger);
  display:flex;align-items:center;justify-content:space-between;
}
.err-retry{background:none;border:none;color:var(--danger);cursor:pointer;font-size:12px;font-family:var(--sans);text-decoration:underline;}

/* ── Pagination ── */
.pag-wrap{margin-top:40px;display:flex;flex-direction:column;align-items:center;gap:16px;}
.pag-controls{display:flex;align-items:center;gap:4px;flex-wrap:wrap;justify-content:center;}
.pag-btn{
  width:38px;height:38px;border-radius:var(--r-sm);font-family:var(--sans);font-size:13px;font-weight:500;
  border:1px solid var(--border);background:var(--navy-800);color:var(--slate);
  cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .18s;
}
.pag-btn:hover:not(:disabled):not(.active){border-color:var(--gold);color:var(--gold);background:var(--gold-dim);}
.pag-btn.active{background:var(--gold);border-color:var(--gold);color:var(--navy-900);}
.pag-btn:disabled{opacity:.35;cursor:not-allowed;}
.pag-btn.dots{cursor:default;border-color:transparent;background:transparent;font-size:16px;color:var(--slate);}
.pag-nav{
  display:flex;align-items:center;gap:6px;padding:0 16px;height:38px;
  border-radius:var(--r-sm);font-family:var(--sans);font-size:13px;font-weight:500;
  border:1px solid var(--border);background:var(--navy-800);color:var(--slate);
  cursor:pointer;transition:all .18s;white-space:nowrap;
}
.pag-nav:hover:not(:disabled){border-color:var(--gold);color:var(--gold);background:var(--gold-dim);}
.pag-nav:disabled{opacity:.35;cursor:not-allowed;}
.pag-info{font-family:var(--sans);font-size:13px;color:var(--slate);}
.pag-info strong{color:var(--cream);font-weight:600;}
.pag-jump{display:flex;align-items:center;gap:8px;font-family:var(--sans);font-size:13px;color:var(--slate);}
.pag-jump-input{
  width:56px;height:36px;border-radius:var(--r-sm);border:1px solid var(--border);
  background:var(--navy-700);color:var(--cream);font-size:13px;text-align:center;
  outline:none;font-family:var(--sans);
}
.pag-jump-input:focus{border-color:var(--gold);}
.pag-jump-btn{
  height:36px;padding:0 14px;border-radius:var(--r-sm);font-family:var(--sans);font-size:13px;
  border:1px solid var(--border);background:var(--navy-700);color:var(--slate);cursor:pointer;transition:all .18s;
}
.pag-jump-btn:hover{border-color:var(--gold);color:var(--gold);}

/* ── Toast System ── */
.toast-portal{position:fixed;top:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:10px;pointer-events:none;}
.toast{
  pointer-events:all;display:flex;align-items:flex-start;gap:13px;
  background:var(--navy-800);border:1px solid var(--border);
  border-radius:14px;padding:14px 16px 14px 14px;
  min-width:300px;max-width:380px;
  box-shadow:0 8px 32px rgba(0,0,0,.4),inset 0 0 0 1px rgba(200,145,40,.08);
  animation:toastIn .38s cubic-bezier(.16,1,.3,1) forwards;
  position:relative;overflow:hidden;
}
.toast.removing{animation:toastOut .28s ease forwards;}
@keyframes toastIn{from{transform:translateX(110%);opacity:0}to{transform:translateX(0);opacity:1}}
@keyframes toastOut{from{transform:translateX(0);opacity:1}to{transform:translateX(110%);opacity:0}}
.toast::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;border-radius:14px 0 0 14px;}
.toast.success::before{background:var(--success);}
.toast.error::before{background:var(--danger);}
.toast.warning::before{background:var(--warning);}
.toast.info::before{background:var(--gold);}
.toast-icon-wrap{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;}
.toast.success .toast-icon-wrap{background:rgba(16,185,129,.12);color:var(--success);}
.toast.error .toast-icon-wrap{background:rgba(239,68,68,.12);color:var(--danger);}
.toast.warning .toast-icon-wrap{background:rgba(245,158,11,.12);color:var(--warning);}
.toast.info .toast-icon-wrap{background:var(--gold-dim);color:var(--gold);}
.toast-content{flex:1;min-width:0;}
.toast-title{font-family:var(--sans);font-size:13px;font-weight:600;color:var(--cream);line-height:1.3;margin-bottom:2px;}
.toast-msg{font-family:var(--sans);font-size:12px;font-weight:400;color:var(--slate);line-height:1.55;}
.toast-close{
  width:24px;height:24px;border-radius:6px;background:transparent;border:none;
  color:var(--slate);display:flex;align-items:center;justify-content:center;
  cursor:pointer;transition:all .15s;flex-shrink:0;margin-top:2px;
}
.toast-close:hover{background:var(--navy-700);color:var(--cream);}
.toast-progress{position:absolute;bottom:0;left:3px;right:0;height:2px;background:var(--navy-700);}
.toast-progress-bar{height:100%;animation:toastProgress linear forwards;}
.toast.success .toast-progress-bar{background:var(--success);}
.toast.error .toast-progress-bar{background:var(--danger);}
.toast.warning .toast-progress-bar{background:var(--warning);}
.toast.info .toast-progress-bar{background:var(--gold);}
@keyframes toastProgress{from{width:100%}to{width:0%}}

/* ── Modal System ── */
.m-overlay{
  position:fixed;inset:0;z-index:1000;
  background:rgba(9,15,29,.82);backdrop-filter:blur(8px) saturate(1.4);
  display:flex;align-items:center;justify-content:center;padding:16px;animation:mFade .22s ease;
}
@keyframes mFade{from{opacity:0}to{opacity:1}}
.m-box{
  background:var(--navy-800);border:1px solid var(--border);border-radius:20px;
  max-width:460px;width:100%;max-height:92vh;overflow-y:auto;
  box-shadow:0 40px 80px rgba(0,0,0,.5),0 0 0 1px rgba(200,145,40,.08);
  animation:mSlide .32s cubic-bezier(.16,1,.3,1);
}
@keyframes mSlide{from{transform:translateY(24px) scale(.97);opacity:0}to{transform:translateY(0) scale(1);opacity:1}}
.m-head-navy{
  background:linear-gradient(135deg,var(--navy-900) 0%,var(--navy-700) 100%);
  padding:24px 24px 20px;border-radius:20px 20px 0 0;position:relative;
  border-bottom:1px solid var(--border);
}
/* Gold accent bar on modal headers */
.m-head-navy::before{
  content:'';position:absolute;top:0;left:0;right:0;height:2px;
  background:linear-gradient(90deg,var(--gold),var(--gold-lt));
  border-radius:20px 20px 0 0;
}
.m-head-title{font-family:var(--serif);font-size:22px;font-weight:300;color:var(--cream);margin-bottom:3px;letter-spacing:-.01em;}
.m-head-sub{font-family:var(--sans);font-size:12px;color:var(--slate);}
.m-close{
  position:absolute;top:14px;right:14px;width:32px;height:32px;
  border-radius:9px;background:rgba(248,248,249,.08);border:1px solid var(--border);
  color:var(--slate);display:flex;align-items:center;justify-content:center;
  cursor:pointer;transition:all .18s;z-index:1;
}
.m-close:hover{background:rgba(248,248,249,.14);color:var(--cream);transform:scale(1.05);}
.m-body{padding:22px 24px 10px;}
.m-footer{padding:12px 24px 22px;display:flex;gap:10px;justify-content:flex-end;}
.m-btn{
  padding:11px 18px;border-radius:10px;font-family:var(--sans);font-size:13px;font-weight:600;
  cursor:pointer;transition:all .18s;border:1px solid var(--border);
  background:transparent;color:var(--slate);
  display:inline-flex;align-items:center;gap:7px;letter-spacing:.01em;
}
.m-btn:hover{border-color:var(--gold);color:var(--cream);background:var(--gold-dim);}
.m-btn:disabled{opacity:.45;cursor:not-allowed;}
.m-btn-navy{background:var(--gold);border-color:var(--gold);color:var(--navy-900);}
.m-btn-navy:hover{background:var(--gold-lt);border-color:var(--gold-lt);color:var(--navy-900);}
.m-btn-success{background:var(--success);border-color:var(--success);color:#fff;}
.m-btn-success:hover{background:#047857;border-color:#047857;color:#fff;}

/* ── Auth Modal ── */
.auth-hero{
  background:linear-gradient(135deg,var(--navy-900) 0%,var(--navy-700) 100%);
  border-radius:20px 20px 0 0;padding:34px 28px 28px;text-align:center;
  position:relative;overflow:hidden;border-bottom:1px solid var(--border);
}
.auth-hero::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--gold),var(--gold-lt));border-radius:20px 20px 0 0;}
.auth-hero-icon{
  width:58px;height:58px;border-radius:17px;
  background:var(--gold-dim);border:1px solid var(--border);
  display:flex;align-items:center;justify-content:center;color:var(--gold);
  margin:0 auto 18px;position:relative;z-index:1;
}
.auth-hero-title{font-family:var(--serif);font-size:23px;font-weight:300;color:var(--cream);margin-bottom:7px;position:relative;z-index:1;}
.auth-hero-desc{font-family:var(--sans);font-size:13px;color:var(--slate);line-height:1.55;position:relative;z-index:1;max-width:300px;margin:0 auto;}
.auth-prop-pill{
  display:inline-flex;align-items:center;gap:8px;
  background:rgba(248,248,249,.06);border:1px solid var(--border);
  border-radius:9px;padding:9px 15px;margin-top:16px;
  font-family:var(--sans);font-size:12px;color:var(--slate);position:relative;z-index:1;
}
.auth-prop-pill strong{color:var(--cream);font-weight:600;}
.auth-opt{
  display:flex;align-items:center;gap:14px;padding:15px 16px;
  border:1px solid var(--border);border-radius:12px;cursor:pointer;
  transition:all .22s;margin-bottom:10px;background:var(--navy-700);position:relative;overflow:hidden;
}
.auth-opt:hover{border-color:var(--gold);transform:translateX(4px);}
.auth-opt:last-child{margin-bottom:0;}
.auth-opt-icon{width:42px;height:42px;border-radius:11px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.auth-opt-icon.login{background:var(--gold-dim);color:var(--gold);}
.auth-opt-icon.signup{background:rgba(16,185,129,.1);color:var(--success);}
.auth-opt-main{font-family:var(--sans);font-size:14px;font-weight:600;color:var(--cream);}
.auth-opt-sub{font-family:var(--sans);font-size:11px;color:var(--slate);margin-top:2px;}
.auth-divider{display:flex;align-items:center;gap:12px;margin:16px 0;font-family:var(--sans);font-size:11px;color:var(--slate);}
.auth-divider::before,.auth-divider::after{content:'';flex:1;height:1px;background:var(--border);}

/* ── Prop Info Card ── */
.prop-info{
  background:var(--navy-700);border:1px solid var(--border);
  border-radius:12px;padding:16px 18px;margin-bottom:18px;
}
.prop-info-name{font-family:var(--serif);font-size:17px;font-weight:400;color:var(--cream);margin-bottom:12px;line-height:1.3;}
.prop-info-row{display:flex;align-items:center;gap:7px;font-family:var(--sans);font-size:12px;color:var(--slate);margin-bottom:6px;}
.prop-info-row:last-child{margin-bottom:0;}
.prop-info-row svg{color:var(--gold);}
.prop-info-row strong{color:var(--cream);}

/* ── Fee Block ── */
.fee-block{
  background:linear-gradient(135deg,var(--navy-900) 0%,var(--navy-700) 100%);
  border:1px solid var(--border);border-radius:12px;padding:22px;
  margin:18px 0;text-align:center;position:relative;overflow:hidden;
}
.fee-block::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--gold),var(--gold-lt));}
.fee-amount{font-family:var(--serif);font-size:30px;font-weight:300;color:var(--gold);letter-spacing:-.02em;margin-bottom:5px;position:relative;z-index:1;}
.fee-label{font-family:var(--sans);font-size:11px;color:var(--slate);position:relative;z-index:1;}

/* ── Payment ── */
.pay-method{display:flex;align-items:center;gap:12px;padding:14px 16px;border:1.5px solid var(--gold);border-radius:10px;background:var(--gold-dim);margin-bottom:14px;}
.pay-secure{
  display:flex;align-items:center;gap:8px;
  background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.2);
  border-radius:9px;padding:10px 13px;font-family:var(--sans);font-size:12px;color:var(--success);
}
.pay-input{
  width:100%;padding:12px 15px;border:1px solid var(--border);border-radius:9px;
  font-size:13px;font-family:var(--sans);
  background:var(--navy-700);color:var(--cream);outline:none;
  transition:border-color .18s,box-shadow .18s;margin-bottom:16px;
}
.pay-input:focus{border-color:var(--gold);box-shadow:0 0 0 3px rgba(200,145,40,.1);}
.pay-input:disabled{background:var(--navy-900);color:var(--slate);}
.pay-input::placeholder{color:var(--slate);}

/* ── Success ── */
.succ-hero{
  background:linear-gradient(135deg,#064e3b 0%,#065f46 100%);
  border-radius:20px 20px 0 0;padding:34px 28px 26px;text-align:center;
  position:relative;overflow:hidden;border-bottom:1px solid rgba(16,185,129,.25);
}
.succ-icon{
  width:64px;height:64px;border-radius:50%;
  background:rgba(255,255,255,.14);border:2px solid rgba(255,255,255,.22);
  display:flex;align-items:center;justify-content:center;color:#fff;
  margin:0 auto 18px;position:relative;z-index:1;
  animation:succ-pop .5s .1s cubic-bezier(.16,1,.3,1) both;
}
@keyframes succ-pop{from{transform:scale(.6);opacity:0}to{transform:scale(1);opacity:1}}
.succ-title{font-family:var(--serif);font-size:23px;font-weight:300;color:#fff;margin-bottom:7px;position:relative;z-index:1;}
.succ-sub{font-family:var(--sans);font-size:13px;color:rgba(255,255,255,.55);line-height:1.55;position:relative;z-index:1;max-width:300px;margin:0 auto;}
.succ-steps-wrap{background:var(--navy-700);border:1px solid var(--border);border-radius:12px;padding:4px 16px;margin-bottom:2px;}
.succ-step{
  display:flex;align-items:center;gap:12px;font-family:var(--sans);
  font-size:13px;color:var(--cream);padding:11px 0;border-bottom:1px solid var(--border);
}
.succ-step:last-child{border-bottom:none;}
.succ-step-icon{width:28px;height:28px;border-radius:8px;background:rgba(16,185,129,.12);color:var(--success);display:flex;align-items:center;justify-content:center;flex-shrink:0;}

/* ── Provider Tabs ── */
.provider-btn{
  flex:1;padding:11px 6px;border-radius:10px;font-family:var(--sans);
  font-size:11px;font-weight:600;border:1.5px solid var(--border);
  background:var(--navy-700);color:var(--slate);cursor:pointer;transition:all .2s;text-align:center;
}
.provider-btn:hover{border-color:var(--slate);color:var(--cream);}
.provider-btn:disabled{opacity:.4;cursor:not-allowed;}
.provider-btn[data-active='true'].tigo{border-color:#00D4AA;background:rgba(0,212,170,.1);color:#4dd9c0;}
.provider-btn[data-active='true'].mpesa{border-color:#00C853;background:rgba(0,200,83,.1);color:#34d399;}
.provider-btn[data-active='true'].airtel{border-color:#FF6B35;background:rgba(255,107,53,.1);color:#fb923c;}
.provider-btn[data-active='true'].halopesa{border-color:#9C27B0;background:rgba(156,39,176,.1);color:#c084fc;}
.field-label{
  font-family:var(--sans);font-size:10px;font-weight:700;
  letter-spacing:.16em;text-transform:uppercase;color:var(--slate);
  margin-bottom:8px;display:block;
}

@keyframes spin{to{transform:rotate(360deg)}}

/* ── RESPONSIVE ── */
@media(max-width:1100px){
  .pr-grid{grid-template-columns:repeat(2,minmax(0,1fr));}
}
@media(max-width:768px){
  .ph-inner{padding:36px 20px 28px;}
  .sb-inner{padding:10px 16px;}
  .pr-body{padding:24px 16px 36px;}
  .adv-inner{padding:10px 16px 14px;}
  .pr-grid{grid-template-columns:minmax(0,1fr);}
  .pr-grid.list .pc{flex-direction:column;}
  .pr-grid.list .pc-img-wrap{width:100%;aspect-ratio:4/3;}
  .adv.open{max-height:160px;}
  .sb-view-btns{display:none;}
  .m-box{border-radius:16px;}
  .m-body{padding:18px 18px 8px;}
  .m-footer{padding:10px 18px 18px;}
  .toast-portal{top:12px;right:12px;left:12px;}
  .toast{min-width:0;width:100%;}
  .pag-jump{display:none;}
  .source-tabs{gap:3px;}
  .source-tab{padding:6px 8px;font-size:10px;}
}
@media(max-width:480px){
  .ph-inner{padding:28px 16px 22px;}
  .sb-inner{gap:6px;}
  .sb-select{min-width:100px;font-size:12px;padding:8px 8px;}
  .sb-filter-btn{padding:8px 10px;font-size:12px;}
  .pr-grid{gap:14px;}
  .pag-controls{gap:3px;}
  .pag-btn{width:32px;height:32px;font-size:12px;}
  .pag-nav{padding:0 10px;font-size:12px;}
}
`;

/* ─── Toast Component ─── */
const ToastIcon = ({ type }: { type: ToastType }) => {
  const props = { size: 17 };
  if (type === 'success') return <CheckCheck {...props} />;
  if (type === 'error')   return <AlertCircle {...props} />;
  if (type === 'warning') return <AlertCircle {...props} />;
  return <Info {...props} />;
};

const ToastItem = ({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) => {
  const [removing, setRemoving] = useState(false);
  const dur = toast.duration ?? 5000;
  const dismiss = useCallback(() => {
    setRemoving(true);
    setTimeout(() => onRemove(toast.id), 280);
  }, [toast.id, onRemove]);
  useEffect(() => {
    const t = setTimeout(dismiss, dur);
    return () => clearTimeout(t);
  }, [dur, dismiss]);
  return (
    <div className={`toast ${toast.type}${removing ? ' removing' : ''}`}>
      <div className="toast-icon-wrap"><ToastIcon type={toast.type} /></div>
      <div className="toast-content">
        <div className="toast-title">{toast.title}</div>
        {toast.message && <div className="toast-msg">{toast.message}</div>}
      </div>
      <button className="toast-close" onClick={dismiss}><X size={13} /></button>
      <div className="toast-progress">
        <div className="toast-progress-bar" style={{ animationDuration: `${dur}ms` }} />
      </div>
    </div>
  );
};

const ToastPortal = ({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) => (
  <div className="toast-portal">
    {toasts.map(t => <ToastItem key={t.id} toast={t} onRemove={onRemove} />)}
  </div>
);

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(p => [...p, { ...t, id }]);
  }, []);
  const removeToast = useCallback((id: string) => {
    setToasts(p => p.filter(t => t.id !== id));
  }, []);
  return { toasts, addToast, removeToast };
}

/* ─── Skeleton ─── */
const SkeletonCard = () => (
  <div className="skel">
    <div className="skel-pulse" style={{ height: 200 }} />
    <div style={{ padding: '16px 18px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="skel-pulse" style={{ height: 11, width: '38%', borderRadius: 4 }} />
      <div className="skel-pulse" style={{ height: 17, width: '72%', borderRadius: 4 }} />
      <div className="skel-pulse" style={{ height: 11, width: '55%', borderRadius: 4 }} />
      <div style={{ height: 12 }} />
      <div style={{ display: 'flex', gap: 8 }}>
        {[55, 55, 55].map((w, i) => <div key={i} className="skel-pulse" style={{ height: 11, width: w, borderRadius: 4 }} />)}
      </div>
    </div>
  </div>
);

/* ─── Property Card ─── */
const PropertyCard = ({ property, isSaved, onSave, onApply }: {
  property: Property; isSaved: boolean;
  onSave: (e: React.MouseEvent) => void; onApply: (e: React.MouseEvent) => void;
}) => {
  const loc    = property.location || property.address;
  const size   = property.size ?? property.area;
  const source = getListingSource(property);

  return (
    <Link to={`/property/${property.id}`} className="pc">
      <div className="pc-img-wrap">
        <img 
  src={getImage(property)} 
  srcSet={getImageSrcSet(property)}
  sizes="(max-width: 768px) 100vw, (max-width: 1100px) 50vw, 33vw"
  width="600" 
  height="450"
  alt={property.title} 
  className="pc-img" 
  loading="lazy" 
  decoding="async"
  fetchPriority="auto"
  style={{ objectFit: 'cover', backgroundColor: 'var(--navy-700)' }}
/>
        <div className="pc-img-overlay" />
        {property.featured && <div className="pc-badge-featured">Featured</div>}
        {property.type && (
          <div className="pc-badge-type">{typeLabel[property.type] ?? property.type}</div>
        )}
        <span className={`pc-badge-source ${source}`}>{sourceLabel[source]}</span>
        <div className="pc-price-overlay">
          <div className="pc-price-main">{formatPrice(property.price)}</div>
          <div className="pc-price-period">/month</div>
        </div>
        <div className="pc-img-actions">
          <button
            className="pc-img-btn"
            onClick={e => {
              e.preventDefault(); e.stopPropagation();
              navigator.clipboard.writeText(`${window.location.origin}/property/${property.id}`);
            }}
            title="Copy link"
          >
            <Share2 size={14} />
          </button>
        </div>
      </div>
      <div className="pc-body">
        {loc && <div className="pc-location"><MapPin size={11} />{loc}</div>}
        <div className="pc-title">{property.title || 'Untitled Property'}</div>
        {property.description && <div className="pc-desc">{property.description}</div>}
        <div className="pc-specs">
          {property.bedrooms != null && (
            <><div className="pc-spec"><Bed size={13} />{property.bedrooms} bed{property.bedrooms !== 1 ? 's' : ''}</div><div className="pc-spec-div" /></>
          )}
          {property.bathrooms != null && (
            <><div className="pc-spec"><Bath size={13} />{property.bathrooms} bath{property.bathrooms !== 1 ? 's' : ''}</div>{size != null && <div className="pc-spec-div" />}</>
          )}
          {size != null && <div className="pc-spec"><Square size={13} />{size} m²</div>}
        </div>
        <div className="pc-footer">
          <div>{property.furnished && <span className="pc-tag">Furnished</span>}</div>
          <div className="pc-foot-actions">
            <button
              className={`pc-save-btn${isSaved ? ' saved' : ''}`}
              onClick={onSave}
              title={isSaved ? 'Unsave property' : 'Save property'}
            >
              <Bookmark size={12} fill={isSaved ? 'currentColor' : 'none'} />
              {isSaved ? 'Saved' : 'Save'}
            </button>
            <button className="pc-foot-btn apply" onClick={onApply}>Visit site</button>
          </div>
        </div>
      </div>
    </Link>
  );
};

/* ─── Modal wrapper ─── */
const Overlay = ({ onClose, children }: { onClose: () => void; children: React.ReactNode }) => (
  <div className="m-overlay" onClick={onClose}>
    <div className="m-box" onClick={e => e.stopPropagation()}>{children}</div>
  </div>
);

/* ─── Auth Modal ─── */
const AuthModal = ({ property, onClose, onLogin, onSignup }: {
  property: Property; onClose: () => void; onLogin: () => void; onSignup: () => void;
}) => (
  <Overlay onClose={onClose}>
    <div className="auth-hero">
      <button className="m-close" onClick={onClose}><X size={15} /></button>
      <div className="auth-hero-icon"><ShieldCheck size={24} /></div>
      <div className="auth-hero-title">Sign in to Book Visit</div>
      <div className="auth-hero-desc">You need an account to book a site visit and connect with agents.</div>
      <div className="auth-prop-pill"><MapPin size={11} />Visiting <strong>{property.title}</strong></div>
    </div>
    <div className="m-body" style={{ paddingTop: 22 }}>
      <div style={{ fontFamily: 'var(--sans)', fontSize: 10, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--slate)', marginBottom: 12 }}>
        Choose an option to continue
      </div>
      <div className="auth-opt" onClick={onLogin} role="button">
        <div className="auth-opt-icon login"><LogIn size={18} /></div>
        <div style={{ flex: 1 }}>
          <div className="auth-opt-main">Sign in to my account</div>
          <div className="auth-opt-sub">I already have an account</div>
        </div>
        <ArrowRight size={15} style={{ color: 'var(--slate)', flexShrink: 0 }} />
      </div>
      <div className="auth-divider">or</div>
      <div className="auth-opt" onClick={onSignup} role="button">
        <div className="auth-opt-icon signup"><UserPlus size={18} /></div>
        <div style={{ flex: 1 }}>
          <div className="auth-opt-main">Create a free account</div>
          <div className="auth-opt-sub">New here? Sign up takes under a minute</div>
        </div>
        <ArrowRight size={15} style={{ color: 'var(--slate)', flexShrink: 0 }} />
      </div>
    </div>
    <div className="m-footer" style={{ justifyContent: 'center', paddingTop: 8 }}>
      <button className="m-btn" onClick={onClose} style={{ fontSize: 12, color: 'var(--slate)' }}>Continue browsing</button>
    </div>
  </Overlay>
);

/* ─── Apply Modal ─── */
const ApplyModal = ({ property, onClose, onProceed }: {
  property: Property; onClose: () => void; onProceed: () => void;
}) => (
  <Overlay onClose={onClose}>
    <div className="m-head-navy">
      <button className="m-close" onClick={onClose}><X size={15} /></button>
      <div className="m-head-title">Book Property Site Visit</div>
      <div className="m-head-sub">Review the details before proceeding</div>
    </div>
    <div className="m-body">
      <div className="prop-info">
        <div className="prop-info-name">{property.title}</div>
        {(property.location || property.address) && (
          <div className="prop-info-row"><MapPin size={12} /><strong>{property.location || property.address}</strong></div>
        )}
        <div className="prop-info-row"><CreditCard size={12} />Monthly rent: <strong>{formatPrice(property.price)}</strong></div>
        {property.bedrooms != null && <div className="prop-info-row"><Bed size={12} />Bedrooms: <strong>{property.bedrooms}</strong></div>}
        {property.furnished && (
          <div className="prop-info-row">
            <CheckCircle2 size={12} style={{ color: 'var(--success)' }} />
            <strong style={{ color: 'var(--success)' }}>Furnished</strong>
          </div>
        )}
      </div>
      <div className="fee-block">
        <div className="fee-amount">TZS 20,000</div>
        <div className="fee-label">Site visit fee · non-refundable</div>
      </div>
      <p style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--slate)', lineHeight: 1.65 }}>
        This fee covers the site visit arrangement. Once paid, the agent is notified immediately and will contact you within 24 hours to schedule the visit.
      </p>
    </div>
    <div className="m-footer">
      <button className="m-btn" onClick={onClose}>Cancel</button>
      <button className="m-btn m-btn-navy" onClick={onProceed}>Proceed to Payment <ArrowRight size={14} /></button>
    </div>
  </Overlay>
);

/* ─── Payment Modal ─── */
const PaymentModal = ({ processing, onClose, onPay, phoneNumber, setPhoneNumber, paymentMethod, setPaymentMethod }: {
  processing: boolean; onClose: () => void; onPay: () => void;
  phoneNumber: string; setPhoneNumber: (value: string) => void;
  paymentMethod: 'tigo' | 'mpesa' | 'airtel' | 'halopesa';
  setPaymentMethod: (value: 'tigo' | 'mpesa' | 'airtel' | 'halopesa') => void;
}) => (
  <Overlay onClose={() => !processing && onClose()}>
    <div className="m-head-navy">
      <button className="m-close" onClick={() => !processing && onClose()} style={{ opacity: processing ? .4 : 1, cursor: processing ? 'not-allowed' : 'pointer' }}>
        <X size={15} />
      </button>
      <div className="m-head-title">Complete Payment</div>
      <div className="m-head-sub">Secure checkout · TZS 20,000</div>
    </div>
    <div className="m-body">
      <div className="fee-block">
        <div className="fee-amount">TZS 20,000</div>
        <div className="fee-label">Site visit fee · non-refundable</div>
      </div>
      <label className="field-label">Mobile Money Provider</label>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { value: 'tigo',     label: 'Tigo Pesa'    },
          { value: 'mpesa',    label: 'M-Pesa'        },
          { value: 'airtel',   label: 'Airtel Money'  },
          { value: 'halopesa', label: 'Halopesa'      },
        ].map((p: any) => (
          <button
            key={p.value}
            className={`provider-btn ${p.value}`}
            data-active={paymentMethod === p.value ? 'true' : 'false'}
            onClick={() => setPaymentMethod(p.value)}
            disabled={processing}
          >
            {p.label}
          </button>
        ))}
      </div>
      <label className="field-label">Phone Number</label>
      <input
        className="pay-input"
        type="tel"
        placeholder="e.g. 0712 345 678"
        value={phoneNumber}
        onChange={e => setPhoneNumber(e.target.value)}
        disabled={processing}
      />
      <div className="pay-secure"><ShieldCheck size={14} />Powered by Selcom · 256-bit encrypted</div>
    </div>
    <div className="m-footer">
      <button className="m-btn" onClick={() => !processing && onClose()} disabled={processing}>Cancel</button>
      <button
        className="m-btn m-btn-success"
        onClick={onPay}
        disabled={processing || !phoneNumber || phoneNumber.length < 10}
      >
        {processing
          ? <><Loader2 size={14} style={{ animation: 'spin .8s linear infinite' }} />Processing…</>
          : <>Pay TZS 20,000 <ArrowRight size={14} /></>
        }
      </button>
    </div>
  </Overlay>
);

/* ─── Success Modal ─── */
const SuccessModal = ({ onClose }: { onClose: () => void }) => (
  <Overlay onClose={onClose}>
    <div className="succ-hero">
      <div className="succ-icon"><CheckCircle2 size={28} /></div>
      <div className="succ-title">Site Visit Booked!</div>
      <div className="succ-sub">Payment confirmed. The agent has been notified and will contact you shortly.</div>
    </div>
    <div className="m-body" style={{ paddingTop: 20 }}>
      <div className="succ-steps-wrap">
        {[
          { label: 'Site visit fee received & confirmed',      icon: <CheckCheck size={14} /> },
          { label: 'Agent notified instantly via SMS & email', icon: <Sparkles size={14} />   },
          { label: 'Expect a call or message within 24 hours', icon: <CheckCircle2 size={14} /> },
        ].map((s, i) => (
          <div key={i} className="succ-step">
            <div className="succ-step-icon">{s.icon}</div>
            {s.label}
          </div>
        ))}
      </div>
    </div>
    <div className="m-footer">
      <button className="m-btn m-btn-navy" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>
        View My Applications <ArrowRight size={14} />
      </button>
    </div>
  </Overlay>
);

/* ─── Main Component ─── */
type ModalStep    = 'none' | 'auth' | 'apply' | 'payment' | 'success';
type SourceFilter = 'all'  | 'agent' | 'landlord' | 'admin';

const Properties = () => {
  const navigate = useNavigate();
  const [searchTerm,    setSearchTerm]   = useState('');
  const [selectedType,  setSelectedType] = useState('');
  const [priceRange,    setPriceRange]   = useState('');
  const [bedrooms,      setBedrooms]     = useState<number | undefined>();
  const [furnished,     setFurnished]    = useState<boolean | undefined>();
  const [sourceFilter,  setSourceFilter] = useState<SourceFilter>('all');
  const [currentPage,   setCurrentPage]  = useState(1);
  const [loading,       setLoading]      = useState(true);
  const [error,         setError]        = useState('');
  const [savedIds,      setSavedIds]     = useState(new Set<number>());
  const [applications,  setApplications] = useState<any[]>([]);
  const [pagination,    setPagination]   = useState<Pagination | null>(null);
  const [viewMode,      setViewMode]     = useState<'grid' | 'list'>('grid');
  const [showFilters,   setShowFilters]  = useState(false);
  const [properties,    setProperties]   = useState<Property[]>([]);
  const [modal,         setModal]        = useState<ModalStep>('none');
  const [selProp,       setSelProp]      = useState<Property | null>(null);
  const [paying,        setPaying]       = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'tigo' | 'mpesa' | 'airtel' | 'halopesa'>('tigo');
  const [phoneNumber,   setPhoneNumber]   = useState('');
  const jumpRef = useRef<HTMLInputElement>(null);

  const { toasts, addToast, removeToast } = useToast();
  const debouncedSearch = useDebounce(searchTerm, 400);

  useEffect(() => { setCurrentPage(1); }, [debouncedSearch, selectedType, priceRange, bedrooms, furnished, sourceFilter]);

  useEffect(() => {
    (async () => {
      try {
        if (localStorage.getItem('token')) {
          const r = await Api.getTenantApplications();
          setApplications(r.data || []);
        }
      } catch { /* silent */ }
    })();
  }, []);

  useEffect(() => {
    const p = sessionStorage.getItem('pendingApplication');
    if (p) {
      sessionStorage.removeItem('pendingApplication');
      setTimeout(() => navigate(`/dashboard/tenant/applications?property=${p}`), 1200);
    }
  }, [navigate]);

  const buildParams = useCallback((pageNum: number) => {
    const p: Record<string, string> = { page: pageNum.toString(), per_page: ITEMS_PER_PAGE.toString() };
    if (debouncedSearch) p.search = debouncedSearch;
    if (selectedType)    p.type   = selectedType;
    if (priceRange === '0-500')    { p.min_price = '0';       p.max_price = '500000'; }
    if (priceRange === '500-1000') { p.min_price = '500000';  p.max_price = '1000000'; }
    if (priceRange === '1000+')    { p.min_price = '1000000'; }
    if (bedrooms)          p.bedrooms  = bedrooms.toString();
    if (furnished != null) p.furnished = furnished ? 'true' : 'false';
    if (sourceFilter === 'agent')    p.has_agent  = 'true';
    if (sourceFilter === 'landlord') p.no_agent   = 'true';
    if (sourceFilter === 'admin')    p.admin_only = 'true';
    return p;
  }, [debouncedSearch, selectedType, priceRange, bedrooms, furnished, sourceFilter]);

  const loadProperties = useCallback(async (pageNum: number) => {
    try {
      setLoading(true);
      setError('');
      const res   = await Api.getProperties(buildParams(pageNum));
      const items: Property[] = res.data?.data ?? res.data ?? [];
      const pag: Pagination | null = res.data?.pagination ?? null;
      setProperties(items);
      setPagination(pag);
    } catch {
      setError('Failed to load properties. Please try again.');
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => { loadProperties(currentPage); }, [currentPage, loadProperties]);

  const totalPages = pagination ? pagination.last_page : 1;
  const pageStart  = pagination ? (pagination.current_page - 1) * pagination.per_page + 1 : 0;
  const pageEnd    = pagination ? Math.min(pagination.current_page * pagination.per_page, pagination.total) : 0;

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleJump = () => {
    const val = parseInt(jumpRef.current?.value ?? '');
    if (!isNaN(val)) goToPage(val);
  };

  const toggleSave = async (id: number, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    try {
      if (savedIds.has(id)) {
        await Api.unsaveProperty(id);
        setSavedIds(p => { const s = new Set(p); s.delete(id); return s; });
        addToast({ type: 'info', title: 'Removed from saved', duration: 3000 });
      } else {
        const response = await Api.saveProperty(id) as { message: string; already_saved?: boolean };
        setSavedIds(p => new Set(p).add(id));
        if (response.already_saved) {
          addToast({ type: 'info', title: 'Already saved', message: 'This property is in your saved list.', duration: 3000 });
        } else {
          addToast({ type: 'success', title: 'Property saved', message: 'You can view saved properties in your dashboard.', duration: 3500 });
        }
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Action failed', message: err?.message || 'Could not update saved properties.' });
    }
  };

  const handleApply = (property: Property, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setSelProp(property);
    setModal(localStorage.getItem('token') ? 'apply' : 'auth');
  };

  const handleAuthLogin = () => {
    if (selProp) sessionStorage.setItem('pendingApplication', selProp.id.toString());
    navigate(`/login?redirect=/dashboard/tenant/applications?property=${selProp?.id}`);
  };
  const handleAuthSignup = () => {
    if (selProp) sessionStorage.setItem('pendingApplication', selProp.id.toString());
    navigate(`/register?redirect=/dashboard/tenant/applications?property=${selProp?.id}`);
  };

  const handlePay = async () => {
    if (!selProp) return;
    if (!phoneNumber || phoneNumber.length < 10) {
      addToast({ type: 'warning', title: 'Invalid phone number', message: 'Please enter a valid mobile money number (at least 10 digits).', duration: 5000 });
      return;
    }
    setPaying(true);
    try {
      const userStr  = localStorage.getItem('user');
      const user     = userStr ? JSON.parse(userStr) : null;
      const tenantId = user?.id;
      if (!tenantId) {
        addToast({ type: 'error', title: 'Not authenticated', message: 'Your session may have expired. Please log in again.' });
        setPaying(false);
        return;
      }
      const paymentData = {
        amount: 20000, property_id: selProp.id, tenant_id: tenantId,
        phone_number: phoneNumber, provider: paymentMethod,
        customer_email: user?.email,
        customer_name: user?.first_name && user?.last_name
          ? `${user.first_name} ${user.last_name}` : user?.first_name || 'Customer',
        payment_type: 'site_visit',
      };
      const paymentResponse = await SelcomService.initiateMobileMoneyPayment(paymentData);
      if (paymentResponse.success && paymentResponse.data?.transaction_id) {
        const transactionId = paymentResponse.data.transaction_id;
        addToast({ type: 'success', title: 'Payment initiated', message: `Check your ${paymentMethod.toUpperCase()} prompt. Ref: ${transactionId}`, duration: 8000 });
        await Api.createApplication({
          property_id: selProp.id, owner_id: selProp.owner?.id,
          service_fee: 20000, payment_status: 'paid',
          payment_method: paymentMethod, transaction_id: transactionId,
        });
        try {
          await Api.createContract({
            property_id: selProp.id, owner_id: selProp.owner?.id, tenant_id: tenantId,
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            rent_amount: selProp.price, status: 'pending_signature',
            payment_status: 'service_fee_paid', service_fee_transaction_id: transactionId,
          });
        } catch (contractError) { console.warn('Contract creation failed:', contractError); }
        if (selProp.agent?.id) {
          try {
            await Api.notifyAgent({
              agent_id: selProp.agent.id, property_id: selProp.id, tenant_id: tenantId,
              message: `Tenant paid service fee via ${paymentMethod.toUpperCase()} for: ${selProp.title}`,
            });
          } catch { /* silent */ }
        }
        setModal('success');
      } else {
        throw new Error(paymentResponse.message || 'Payment initiation failed');
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Payment failed', message: err?.message || 'Something went wrong. Please try again.', duration: 7000 });
    } finally {
      setPaying(false);
    }
  };

  const closeModal = () => { if (!paying) { setModal('none'); setSelProp(null); } };

  const clearFilters = () => {
    setSearchTerm(''); setSelectedType(''); setPriceRange('');
    setBedrooms(undefined); setFurnished(undefined); setSourceFilter('all');
  };

  const activeFilterCount =
    [selectedType, priceRange, bedrooms, furnished].filter(v => v != null && v !== '').length +
    (sourceFilter !== 'all' ? 1 : 0);

  const sourceTabs: { key: SourceFilter; label: string; icon: React.ReactNode }[] = [
    { key: 'all',      label: 'All',      icon: <List     size={12} /> },
    { key: 'agent',    label: 'Agent',    icon: <Users    size={12} /> },
    { key: 'landlord', label: 'Landlord', icon: <Home     size={12} /> },
    { key: 'admin',    label: 'Oweru',    icon: <Building2 size={12} /> },
  ];

  return (
    <div style={{ fontFamily: "'Jost', sans-serif", background: '#0F172A', minHeight: '100vh' }}>
      <style>{CSS}</style>
      <ToastPortal toasts={toasts} onRemove={removeToast} />

      {/* ── Header ── */}
      <div className="ph">
        <div className="ph-inner">
          <div>
            <div className="ph-eyebrow">Browse listings</div>
            <h1 className="ph-title">Available<br /><em>Properties</em></h1>
            <div className="ph-source-pills">
              <span className="ph-pill ph-pill-agent">Agent listings</span>
              <span className="ph-pill ph-pill-landlord">Landlord listings</span>
              <span className="ph-pill ph-pill-admin">Oweru Rentals</span>
            </div>
          </div>
          <div className="ph-meta">
            {loading ? 'Fetching listings…'
              : pagination
                ? <><strong>{pagination.total}</strong> total listings</>
                : <><strong>{properties.length}</strong> listings found</>}
            {pagination && (
              <div style={{ marginTop: 5, fontSize: 12, color: 'var(--slate)' }}>
                Page <strong style={{ color: 'var(--gold)' }}>{pagination.current_page}</strong> of{' '}
                <strong style={{ color: 'var(--gold)' }}>{pagination.last_page}</strong>
              </div>
            )}
            {applications.length > 0 && (
              <div style={{ marginTop: 5, fontSize: 12, color: 'var(--gold)' }}>
                {applications.length} active application{applications.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Search Bar ── */}
      <div className="sb">
        <div className="sb-inner">
          <div className="sb-search">
            <span className="sb-search-icon"><Search size={14} /></span>
            <input
              className="sb-input"
              type="text"
              placeholder="Location or property name…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            {searchTerm && <button className="sb-clear" onClick={() => setSearchTerm('')}><X size={13} /></button>}
          </div>
          <select className="sb-select" value={selectedType} onChange={e => setSelectedType(e.target.value)}>
            <option value="">All types</option>
            <option value="house">House</option>
            <option value="Master-bedroom">Master-bedroom</option>
            <option value="Single-room">Single room</option>
          </select>
          <select className="sb-select" value={priceRange} onChange={e => setPriceRange(e.target.value)}>
            <option value="">All prices</option>
            <option value="0-500">Under 500K TZS</option>
            <option value="500-1000">500K – 1M TZS</option>
            <option value="1000+">Above 1M TZS</option>
          </select>

          {/* Source filter tabs */}
          <div className="source-tabs">
            {sourceTabs.map(tab => {
              const isActive = sourceFilter === tab.key;
              const cls = isActive
                ? tab.key === 'agent' ? 'source-tab active-agent'
                : tab.key === 'admin' ? 'source-tab active-admin'
                : 'source-tab active'
                : 'source-tab';
              return (
                <button key={tab.key} className={cls} onClick={() => setSourceFilter(tab.key)}>
                  {tab.icon}{tab.label}
                </button>
              );
            })}
          </div>

          <button className={`sb-filter-btn${showFilters ? ' active' : ''}`} onClick={() => setShowFilters(v => !v)}>
            <SlidersHorizontal size={13} /> Filters
            {activeFilterCount > 0 && <span className="sb-filter-count">{activeFilterCount}</span>}
            <ChevronDown size={11} style={{ transform: showFilters ? 'rotate(180deg)' : 'none', transition: 'transform .25s' }} />
          </button>

          <button className="sb-filter-btn" onClick={() => loadProperties(currentPage)} title="Refresh">
            <Search size={13} />
          </button>

          <div className="sb-view-btns">
            <button className={`sb-view-btn${viewMode === 'grid' ? ' active' : ''}`} onClick={() => setViewMode('grid')} title="Grid"><LayoutGrid size={15} /></button>
            <button className={`sb-view-btn${viewMode === 'list' ? ' active' : ''}`} onClick={() => setViewMode('list')} title="List"><List size={15} /></button>
          </div>
        </div>

        {/* Advanced filters */}
        <div className={`adv${showFilters ? ' open' : ''}`}>
          <div className="adv-inner">
            <span className="adv-label">Refine</span>
            <select className="sb-select" style={{ minWidth: 110 }} value={bedrooms?.toString() ?? ''} onChange={e => setBedrooms(e.target.value ? parseInt(e.target.value) : undefined)}>
              <option value="">Bedrooms</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
            </select>
            <select className="sb-select" style={{ minWidth: 130 }} value={furnished == null ? '' : furnished ? 'true' : 'false'} onChange={e => { const v = e.target.value; setFurnished(v === '' ? undefined : v === 'true'); }}>
              <option value="">Furnishing</option>
              <option value="true">Furnished</option>
              <option value="false">Unfurnished</option>
            </select>
            {(activeFilterCount > 0 || searchTerm) && (
              <button className="adv-clear" onClick={clearFilters}><X size={11} /> Clear all</button>
            )}
          </div>
        </div>
      </div>

      {/* ── Listings ── */}
      <div className="pr-body">
        {error && (
          <div className="err-banner">
            {error}
            <button className="err-retry" onClick={() => loadProperties(currentPage)}>Retry</button>
          </div>
        )}

        {loading ? (
          <div className={`pr-grid${viewMode === 'list' ? ' list' : ''}`}>
            {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : properties.length > 0 ? (
          <div className={`pr-grid${viewMode === 'list' ? ' list' : ''}`}>
            {properties.map(p => (
              <PropertyCard
                key={p.id}
                property={p}
                isSaved={savedIds.has(p.id)}
                onSave={e => toggleSave(p.id, e)}
                onApply={e => handleApply(p, e)}
              />
            ))}
          </div>
        ) : (
          <div className="pr-grid">
            <div className="pr-empty">
              <div className="pr-empty-icon"><Search size={22} /></div>
              <div className="pr-empty-title">No properties found</div>
              <div className="pr-empty-desc">Try adjusting your filters or search terms.</div>
              {(activeFilterCount > 0 || searchTerm) && (
                <button className="pr-empty-btn" onClick={clearFilters}><X size={13} /> Clear filters</button>
              )}
            </div>
          </div>
        )}

        {/* ── Pagination ── */}
        {!loading && totalPages > 1 && (
          <div className="pag-wrap">
            <div className="pag-info">
              Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{pagination?.total ?? 0}</strong> properties
            </div>
            <div className="pag-controls">
              <button className="pag-nav" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
                <ChevronLeft size={15} /> Prev
              </button>
              {getPageNumbers(currentPage, totalPages).map((p, i) =>
                p === '...'
                  ? <button key={`dots-${i}`} className="pag-btn dots" disabled>…</button>
                  : <button
                      key={p}
                      className={`pag-btn${p === currentPage ? ' active' : ''}`}
                      onClick={() => goToPage(p as number)}
                    >
                      {p}
                    </button>
              )}
              <button className="pag-nav" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
                Next <ChevronRight size={15} />
              </button>
            </div>
            <div className="pag-jump">
              <span>Go to page</span>
              <input
                ref={jumpRef}
                className="pag-jump-input"
                type="number"
                min={1}
                max={totalPages}
                defaultValue={currentPage}
                onKeyDown={e => e.key === 'Enter' && handleJump()}
              />
              <button className="pag-jump-btn" onClick={handleJump}>Go</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {modal === 'auth'    && selProp && <AuthModal    property={selProp} onClose={closeModal} onLogin={handleAuthLogin} onSignup={handleAuthSignup} />}
      {modal === 'apply'   && selProp && <ApplyModal   property={selProp} onClose={closeModal} onProceed={() => setModal('payment')} />}
      {modal === 'payment' && selProp && (
        <PaymentModal
          processing={paying} onClose={closeModal} onPay={handlePay}
          phoneNumber={phoneNumber} setPhoneNumber={setPhoneNumber}
          paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod}
        />
      )}
      {modal === 'success' && (
        <SuccessModal onClose={() => { closeModal(); navigate('/dashboard/tenant/applications'); }} />
      )}
    </div>
  );
};

export default Properties;