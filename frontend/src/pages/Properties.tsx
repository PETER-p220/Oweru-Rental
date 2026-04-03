import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, MapPin, Bed, Bath, Square, Share2,
  SlidersHorizontal, X, ChevronDown, LayoutGrid, List,
  CreditCard, LogIn, UserPlus, ShieldCheck, CheckCircle2,
  ArrowRight, Loader2, AlertCircle, Info, CheckCheck, Sparkles,
  Bookmark,
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
  owner?: { id?: number; name?: string; first_name?: string; last_name?: string };
  agent?: { id?: number; name?: string; code?: string };
  dalali?: string;
}

/* ─── Toast Types ─── */
type ToastType = 'success' | 'error' | 'info' | 'warning';
interface Toast { id: string; type: ToastType; title: string; message?: string; duration?: number; }

/* ─── Hooks ─── */
function useDebounce<T>(value: T, delay: number): T {
  const [d, setD] = useState(value);
  useEffect(() => { const t = setTimeout(() => setD(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return d;
}

/* ─── Helpers ─── */
const VITE_STORAGE = import.meta.env.VITE_API_URL?.replace('/api', '') ?? '';

const formatPrice = (p: number | null | undefined): string => {
  if (p == null || isNaN(Number(p))) return 'Price on request';
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(p));
};

const typeLabel: Record<string, string> = {
  apartment: 'Apartment', house: 'House', studio: 'Studio', villa: 'Villa', commercial: 'Commercial',
};

const getImage = (p: Property): string => {
  if (p.images?.length) {
    const i = p.images[0];
    return i.startsWith('http') ? i : `${VITE_STORAGE}/storage/${i}`;
  }
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect width='600' height='400' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='24' fill='%236b7280'%3ENo Image%3C/text%3E%3C/svg%3E`;
};

/* ─── CSS ─── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --navy:#1E3A5F;--navy-2:#2D5282;--navy-faint:rgba(30,58,95,.06);--navy-soft:rgba(30,58,95,.12);
  --gold:#C9A84C;--gold-faint:rgba(201,168,76,.10);
  --bg:#F8FAFC;--surface:#FFFFFF;--border:#E2E8F0;
  --muted:#64748B;--hint:#94A3B8;--text:#1E293B;
  --success:#059669;--danger:#DC2626;--warning:#D97706;--info:#0284C7;
  --sans:'DM Sans',system-ui,sans-serif;--serif:'Fraunces',Georgia,serif;
  --r:12px;--r-sm:8px;--r-xs:6px;
}

/* ── Page Header ── */
.ph{background:var(--navy);}
.ph-inner{max-width:1280px;margin:0 auto;padding:52px 40px 44px;display:flex;align-items:flex-end;justify-content:space-between;gap:20px;flex-wrap:wrap;}
.ph-eyebrow{font-family:var(--sans);font-size:10px;font-weight:500;letter-spacing:.22em;text-transform:uppercase;color:var(--gold);margin-bottom:10px;display:flex;align-items:center;gap:10px;}
.ph-eyebrow::before{content:'';width:20px;height:1px;background:var(--gold);}
.ph-title{font-family:var(--serif);font-size:clamp(28px,4vw,48px);font-weight:300;line-height:1.08;letter-spacing:-.02em;color:#fff;}
.ph-title em{font-style:italic;color:rgba(201,168,76,.9);}
.ph-meta{font-family:var(--sans);font-size:13px;font-weight:300;color:rgba(255,255,255,.5);text-align:right;}
.ph-meta strong{color:var(--gold);font-weight:400;}

/* ── Search Bar ── */
.sb{background:var(--surface);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:50;box-shadow:0 1px 8px rgba(0,0,0,.06);}
.sb-inner{max-width:1280px;margin:0 auto;padding:12px 40px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.sb-search{flex:1;min-width:220px;display:flex;align-items:center;background:var(--bg);border:1px solid var(--border);border-radius:var(--r-sm);overflow:hidden;transition:border-color .18s;}
.sb-search:focus-within{border-color:var(--navy);}
.sb-search-icon{padding:0 10px;color:var(--hint);display:flex;align-items:center;flex-shrink:0;}
.sb-input{flex:1;background:transparent;border:none;outline:none;color:var(--text);font-family:var(--sans);font-size:13px;padding:9px 10px 9px 0;}
.sb-input::placeholder{color:var(--hint);}
.sb-clear{background:none;border:none;color:var(--hint);cursor:pointer;padding:0 10px;display:flex;align-items:center;transition:color .15s;}
.sb-clear:hover{color:var(--text);}
.sb-select{background:var(--bg);border:1px solid var(--border);border-radius:var(--r-sm);color:var(--muted);padding:9px 12px;font-family:var(--sans);font-size:13px;outline:none;cursor:pointer;appearance:none;transition:border-color .18s;min-width:130px;}
.sb-select:focus{border-color:var(--navy);color:var(--text);}
.sb-filter-btn{display:flex;align-items:center;gap:6px;background:var(--bg);border:1px solid var(--border);border-radius:var(--r-sm);color:var(--muted);padding:9px 14px;font-family:var(--sans);font-size:13px;cursor:pointer;white-space:nowrap;transition:all .18s;}
.sb-filter-btn:hover,.sb-filter-btn.active{border-color:var(--navy);color:var(--navy);background:var(--navy-faint);}
.sb-filter-count{background:var(--navy);color:#fff;width:16px;height:16px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:500;}
.sb-view-btns{display:flex;gap:4px;flex-shrink:0;}
.sb-view-btn{width:34px;height:34px;background:var(--bg);border:1px solid var(--border);border-radius:var(--r-sm);color:var(--hint);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .18s;}
.sb-view-btn.active{background:var(--navy);border-color:var(--navy);color:#fff;}
.sb-view-btn:hover:not(.active){border-color:var(--navy);color:var(--navy);}

/* ── Adv Filters ── */
.adv{background:var(--bg);border-bottom:1px solid var(--border);max-height:0;overflow:hidden;transition:max-height .3s ease;}
.adv.open{max-height:80px;}
.adv-inner{max-width:1280px;margin:0 auto;padding:12px 40px 16px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.adv-label{font-family:var(--sans);font-size:10px;font-weight:500;letter-spacing:.18em;text-transform:uppercase;color:var(--hint);margin-right:4px;flex-shrink:0;}
.adv-clear{display:flex;align-items:center;gap:5px;background:transparent;border:1px solid var(--border);border-radius:var(--r-sm);color:var(--muted);padding:7px 12px;font-family:var(--sans);font-size:12px;cursor:pointer;transition:all .18s;margin-left:auto;}
.adv-clear:hover{color:var(--danger);border-color:var(--danger);}

/* ── Body / Grid ── */
.pr-body{max-width:1280px;margin:0 auto;padding:36px 40px 80px;}
.pr-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;}
.pr-grid.list{grid-template-columns:minmax(0,1fr);}

/* ── Property Card ── */
.pc{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);overflow:hidden;transition:box-shadow .22s,transform .22s,border-color .22s;display:flex;flex-direction:column;text-decoration:none;color:inherit;}
.pc:hover{box-shadow:0 8px 28px rgba(30,58,95,.10);transform:translateY(-2px);border-color:rgba(30,58,95,.2);}
.pr-grid.list .pc{flex-direction:row;}
.pc-img-wrap{position:relative;overflow:hidden;aspect-ratio:4/3;flex-shrink:0;}
.pr-grid.list .pc-img-wrap{width:260px;aspect-ratio:auto;}
.pc-img{width:100%;height:100%;object-fit:cover;transition:transform .4s ease;}
.pc:hover .pc-img{transform:scale(1.04);}
.pc-img-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(15,25,50,.55) 0%,transparent 55%);}
.pc-badge-featured{position:absolute;top:12px;left:12px;background:var(--gold);color:#1a1000;font-family:var(--sans);font-size:9px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;padding:4px 10px;border-radius:4px;}
.pc-badge-type{position:absolute;bottom:12px;left:12px;background:rgba(30,58,95,.85);color:rgba(201,168,76,.95);font-family:var(--sans);font-size:9px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;padding:4px 10px;border-radius:4px;backdrop-filter:blur(6px);}
.pc-price-overlay{position:absolute;bottom:12px;right:12px;text-align:right;}
.pc-price-main{font-family:var(--serif);font-size:18px;font-weight:300;color:#fff;letter-spacing:-.01em;}
.pc-price-period{font-family:var(--sans);font-size:10px;color:rgba(255,255,255,.55);}
.pc-img-actions{position:absolute;top:12px;right:12px;display:flex;flex-direction:column;gap:4px;opacity:0;transition:opacity .22s;}
.pc:hover .pc-img-actions{opacity:1;}
.pc-img-btn{width:30px;height:30px;background:rgba(255,255,255,.92);border:none;border-radius:6px;color:var(--muted);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .15s;}
.pc-img-btn:hover{color:var(--navy);background:#fff;}
.pc-body{padding:16px 18px 18px;display:flex;flex-direction:column;flex:1;}
.pc-location{display:flex;align-items:center;gap:4px;font-family:var(--sans);font-size:11px;letter-spacing:.06em;color:var(--hint);margin-bottom:6px;}
.pc-title{font-family:var(--serif);font-size:17px;font-weight:400;color:var(--navy);letter-spacing:-.01em;line-height:1.3;margin-bottom:4px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.pc-desc{font-family:var(--sans);font-size:12px;font-weight:300;line-height:1.65;color:var(--hint);margin-bottom:12px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.pc-specs{display:flex;align-items:center;gap:10px;padding:10px 0;margin:auto 0 12px;border-top:1px solid var(--border);border-bottom:1px solid var(--border);}
.pc-spec{display:flex;align-items:center;gap:5px;font-family:var(--sans);font-size:12px;color:var(--muted);}
.pc-spec svg{color:var(--navy);opacity:.7;}
.pc-spec-div{width:1px;height:12px;background:var(--border);}
.pc-footer{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;}
.pc-foot-actions{display:flex;align-items:center;gap:6px;}

/* ── Save Button ── */
.pc-save-btn{
  height:30px;
  border-radius:6px;
  border:1px solid var(--border);
  background:var(--bg);
  color:var(--muted);
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:5px;
  cursor:pointer;
  transition:all .18s;
  padding:0 10px;
  font-family:var(--sans);
  font-size:12px;
  font-weight:500;
  white-space:nowrap;
}
.pc-save-btn:hover{border-color:var(--navy);color:var(--navy);background:var(--navy-faint);}
.pc-save-btn.saved{
  color:#fff;
  border-color:var(--navy);
  background:var(--navy);
}
.pc-save-btn.saved:hover{background:var(--navy-2);border-color:var(--navy-2);}

.pc-foot-btn{height:30px;border-radius:6px;border:1px solid var(--border);background:var(--bg);color:var(--muted);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .15s;padding:0 8px;}
.pc-foot-btn:hover{border-color:var(--navy);color:var(--navy);background:var(--navy-faint);}
.pc-foot-btn.apply{background:var(--navy);border-color:var(--navy);color:#fff;padding:0 14px;font-family:var(--sans);font-size:12px;font-weight:600;letter-spacing:.02em;}
.pc-foot-btn.apply:hover{background:var(--navy-2);border-color:var(--navy-2);}
.pc-tag{font-family:var(--sans);font-size:10px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:var(--navy-2);background:var(--navy-faint);border:1px solid var(--navy-soft);padding:3px 8px;border-radius:4px;}

/* ── Skeleton ── */
.skel{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);overflow:hidden;}
.skel-pulse{background:linear-gradient(90deg,var(--border) 25%,#F1F5F9 50%,var(--border) 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}

/* ── Empty / Error ── */
.pr-empty{grid-column:1/-1;display:flex;flex-direction:column;align-items:center;padding:80px 40px;text-align:center;background:var(--surface);border:1px solid var(--border);border-radius:var(--r);}
.pr-empty-icon{width:60px;height:60px;border-radius:16px;background:var(--navy-faint);border:1px solid var(--navy-soft);display:flex;align-items:center;justify-content:center;color:var(--navy);margin-bottom:20px;}
.pr-empty-title{font-family:var(--serif);font-size:24px;font-weight:300;color:var(--navy);margin-bottom:6px;}
.pr-empty-desc{font-family:var(--sans);font-size:14px;font-weight:300;color:var(--hint);margin-bottom:24px;}
.pr-empty-btn{display:inline-flex;align-items:center;gap:6px;background:transparent;border:1px solid var(--border);border-radius:var(--r-sm);color:var(--muted);padding:9px 18px;font-family:var(--sans);font-size:13px;cursor:pointer;transition:all .18s;}
.pr-empty-btn:hover{border-color:var(--navy);color:var(--navy);background:var(--navy-faint);}
.err-banner{background:rgba(220,38,38,.05);border:1px solid rgba(220,38,38,.2);border-radius:var(--r-sm);padding:12px 16px;margin-bottom:24px;font-family:var(--sans);font-size:13px;color:var(--danger);display:flex;align-items:center;justify-content:space-between;}
.err-retry{background:none;border:none;color:var(--danger);cursor:pointer;font-size:12px;font-family:var(--sans);text-decoration:underline;}
.load-more{display:flex;align-items:center;justify-content:center;margin-top:36px;}
.load-more-btn{display:flex;align-items:center;gap:8px;background:var(--surface);border:1px solid var(--border);border-radius:var(--r-sm);color:var(--muted);padding:11px 28px;font-family:var(--sans);font-size:13px;cursor:pointer;transition:all .18s;}
.load-more-btn:hover{border-color:var(--navy);color:var(--navy);background:var(--navy-faint);}
.load-more-btn:disabled{opacity:.4;cursor:not-allowed;}

/* ── Toast System ── */
.toast-portal{position:fixed;top:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:10px;pointer-events:none;}
.toast{pointer-events:all;display:flex;align-items:flex-start;gap:13px;background:#fff;border-radius:14px;padding:14px 16px 14px 14px;min-width:320px;max-width:400px;box-shadow:0 8px 32px rgba(0,0,0,.12),0 2px 8px rgba(0,0,0,.06),inset 0 0 0 1px rgba(0,0,0,.06);animation:toastIn .38s cubic-bezier(.16,1,.3,1) forwards;position:relative;overflow:hidden;}
.toast.removing{animation:toastOut .28s ease forwards;}
@keyframes toastIn{from{transform:translateX(110%);opacity:0}to{transform:translateX(0);opacity:1}}
@keyframes toastOut{from{transform:translateX(0);opacity:1}to{transform:translateX(110%);opacity:0}}
.toast::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;border-radius:14px 0 0 14px;}
.toast.success::before{background:linear-gradient(to bottom,#34d399,var(--success));}
.toast.error::before{background:linear-gradient(to bottom,#f87171,var(--danger));}
.toast.warning::before{background:linear-gradient(to bottom,#fbbf24,var(--warning));}
.toast.info::before{background:linear-gradient(to bottom,#38bdf8,var(--info));}
.toast-icon-wrap{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;}
.toast.success .toast-icon-wrap{background:rgba(5,150,105,.1);color:var(--success);}
.toast.error .toast-icon-wrap{background:rgba(220,38,38,.1);color:var(--danger);}
.toast.warning .toast-icon-wrap{background:rgba(217,119,6,.1);color:var(--warning);}
.toast.info .toast-icon-wrap{background:rgba(2,132,199,.1);color:var(--info);}
.toast-content{flex:1;min-width:0;}
.toast-title{font-family:var(--sans);font-size:13px;font-weight:600;color:var(--text);line-height:1.3;margin-bottom:2px;}
.toast-msg{font-family:var(--sans);font-size:12px;font-weight:400;color:var(--hint);line-height:1.55;}
.toast-close{width:24px;height:24px;border-radius:6px;background:transparent;border:none;color:var(--hint);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .15s;flex-shrink:0;margin-top:2px;}
.toast-close:hover{background:var(--bg);color:var(--text);}
.toast-progress{position:absolute;bottom:0;left:3px;right:0;height:2px;background:var(--border);}
.toast-progress-bar{height:100%;animation:toastProgress linear forwards;}
.toast.success .toast-progress-bar{background:var(--success);}
.toast.error .toast-progress-bar{background:var(--danger);}
.toast.warning .toast-progress-bar{background:var(--warning);}
.toast.info .toast-progress-bar{background:var(--info);}
@keyframes toastProgress{from{width:100%}to{width:0%}}

/* ── Modal System ── */
.m-overlay{position:fixed;inset:0;z-index:1000;background:rgba(10,18,35,.72);backdrop-filter:blur(8px) saturate(1.4);display:flex;align-items:center;justify-content:center;padding:20px;animation:mFade .22s ease;}
@keyframes mFade{from{opacity:0}to{opacity:1}}
.m-box{background:var(--surface);border-radius:20px;max-width:460px;width:100%;max-height:92vh;overflow-y:auto;box-shadow:0 40px 80px rgba(0,0,0,.28),0 0 0 1px rgba(255,255,255,.08);animation:mSlide .32s cubic-bezier(.16,1,.3,1);}
@keyframes mSlide{from{transform:translateY(24px) scale(.97);opacity:0}to{transform:translateY(0) scale(1);opacity:1}}
.m-head-navy{background:linear-gradient(135deg,var(--navy) 0%,#0f2744 100%);padding:24px 24px 20px;border-radius:20px 20px 0 0;position:relative;border-bottom:1px solid rgba(201,168,76,.15);}
.m-head-navy::after{content:'';position:absolute;inset:0;border-radius:20px 20px 0 0;background:radial-gradient(ellipse at top right,rgba(201,168,76,.08) 0%,transparent 60%);pointer-events:none;}
.m-head-title{font-family:var(--serif);font-size:22px;font-weight:300;color:#fff;margin-bottom:3px;letter-spacing:-.01em;}
.m-head-sub{font-family:var(--sans);font-size:12px;color:rgba(255,255,255,.45);}
.m-close{position:absolute;top:14px;right:14px;width:32px;height:32px;border-radius:9px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.15);color:rgba(255,255,255,.65);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .18s;z-index:1;}
.m-close:hover{background:rgba(255,255,255,.2);color:#fff;transform:scale(1.05);}
.m-body{padding:22px 24px 10px;}
.m-footer{padding:12px 24px 22px;display:flex;gap:10px;justify-content:flex-end;}
.m-btn{padding:11px 18px;border-radius:10px;font-family:var(--sans);font-size:13px;font-weight:500;cursor:pointer;transition:all .18s;border:1px solid var(--border);background:var(--bg);color:var(--muted);display:inline-flex;align-items:center;gap:7px;letter-spacing:.01em;}
.m-btn:hover{border-color:var(--navy);color:var(--navy);background:var(--navy-faint);}
.m-btn:disabled{opacity:.45;cursor:not-allowed;}
.m-btn-navy{background:var(--navy);border-color:var(--navy);color:#fff;}
.m-btn-navy:hover{background:var(--navy-2);border-color:var(--navy-2);color:#fff;box-shadow:0 4px 14px rgba(30,58,95,.3);}
.m-btn-success{background:var(--success);border-color:var(--success);color:#fff;}
.m-btn-success:hover{background:#047857;border-color:#047857;color:#fff;box-shadow:0 4px 14px rgba(5,150,105,.3);}

/* ── Auth Modal ── */
.auth-hero{background:linear-gradient(135deg,var(--navy) 0%,#0f2744 100%);border-radius:20px 20px 0 0;padding:34px 28px 28px;text-align:center;position:relative;overflow:hidden;}
.auth-hero::before{content:'';position:absolute;top:-40px;right:-40px;width:180px;height:180px;border-radius:50%;background:rgba(201,168,76,.08);pointer-events:none;}
.auth-hero::after{content:'';position:absolute;bottom:-30px;left:-30px;width:120px;height:120px;border-radius:50%;background:rgba(201,168,76,.05);pointer-events:none;}
.auth-hero-icon{width:58px;height:58px;border-radius:17px;background:rgba(201,168,76,.15);border:1px solid rgba(201,168,76,.28);display:flex;align-items:center;justify-content:center;color:var(--gold);margin:0 auto 18px;position:relative;z-index:1;box-shadow:0 8px 20px rgba(0,0,0,.2);}
.auth-hero-title{font-family:var(--serif);font-size:23px;font-weight:300;color:#fff;margin-bottom:7px;position:relative;z-index:1;}
.auth-hero-desc{font-family:var(--sans);font-size:13px;color:rgba(255,255,255,.5);line-height:1.55;position:relative;z-index:1;max-width:300px;margin:0 auto;}
.auth-prop-pill{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.13);border-radius:9px;padding:9px 15px;margin-top:16px;font-family:var(--sans);font-size:12px;color:rgba(255,255,255,.55);position:relative;z-index:1;}
.auth-prop-pill strong{color:#fff;font-weight:500;}
.auth-opt{display:flex;align-items:center;gap:14px;padding:15px 16px;border:1px solid var(--border);border-radius:12px;cursor:pointer;transition:all .22s;margin-bottom:10px;background:var(--surface);position:relative;overflow:hidden;}
.auth-opt::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,var(--navy-faint),transparent);opacity:0;transition:opacity .22s;}
.auth-opt:hover{border-color:var(--navy);transform:translateX(4px);box-shadow:0 4px 16px rgba(30,58,95,.08);}
.auth-opt:hover::before{opacity:1;}
.auth-opt:last-child{margin-bottom:0;}
.auth-opt-icon{width:42px;height:42px;border-radius:11px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.auth-opt-icon.login{background:var(--navy-faint);color:var(--navy);}
.auth-opt-icon.signup{background:rgba(5,150,105,.08);color:var(--success);}
.auth-opt-main{font-family:var(--sans);font-size:14px;font-weight:500;color:var(--text);}
.auth-opt-sub{font-family:var(--sans);font-size:11px;color:var(--hint);margin-top:2px;}
.auth-divider{display:flex;align-items:center;gap:12px;margin:16px 0;font-family:var(--sans);font-size:11px;color:var(--hint);}
.auth-divider::before,.auth-divider::after{content:'';flex:1;height:1px;background:var(--border);}

/* ── Prop Info Card ── */
.prop-info{background:linear-gradient(135deg,var(--bg) 0%,#EFF4FF 100%);border:1px solid var(--border);border-radius:12px;padding:16px 18px;margin-bottom:18px;position:relative;overflow:hidden;}
.prop-info::after{content:'';position:absolute;top:-20px;right:-20px;width:80px;height:80px;border-radius:50%;background:rgba(30,58,95,.04);pointer-events:none;}
.prop-info-name{font-family:var(--serif);font-size:17px;font-weight:400;color:var(--navy);margin-bottom:12px;line-height:1.3;}
.prop-info-row{display:flex;align-items:center;gap:7px;font-family:var(--sans);font-size:12px;color:var(--muted);margin-bottom:6px;}
.prop-info-row:last-child{margin-bottom:0;}
.prop-info-row strong{color:var(--text);}

/* ── Fee Block ── */
.fee-block{background:linear-gradient(135deg,var(--navy) 0%,#0f2744 100%);border-radius:12px;padding:22px;margin:18px 0;text-align:center;position:relative;overflow:hidden;box-shadow:0 8px 24px rgba(30,58,95,.2);}
.fee-block::before{content:'';position:absolute;top:-30px;right:-30px;width:110px;height:110px;border-radius:50%;background:rgba(201,168,76,.1);}
.fee-block::after{content:'';position:absolute;bottom:-20px;left:-20px;width:70px;height:70px;border-radius:50%;background:rgba(201,168,76,.06);}
.fee-amount{font-family:var(--serif);font-size:30px;font-weight:300;color:#fff;letter-spacing:-.02em;margin-bottom:5px;position:relative;z-index:1;}
.fee-label{font-family:var(--sans);font-size:11px;color:rgba(255,255,255,.45);position:relative;z-index:1;}

/* ── Payment ── */
.pay-method{display:flex;align-items:center;gap:12px;padding:14px 16px;border:1.5px solid var(--navy);border-radius:10px;background:var(--navy-faint);margin-bottom:14px;}
.pay-method-icon{width:42px;height:42px;border-radius:10px;background:var(--navy-faint);border:1px solid var(--navy-soft);display:flex;align-items:center;justify-content:center;color:var(--navy);}
.pay-method-name{font-family:var(--sans);font-size:13px;font-weight:600;color:var(--text);}
.pay-method-sub{font-family:var(--sans);font-size:11px;color:var(--hint);}
.pay-badge{margin-left:auto;background:var(--navy);color:#fff;font-family:var(--sans);font-size:9px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;padding:4px 8px;border-radius:4px;}
.pay-secure{display:flex;align-items:center;gap:8px;background:rgba(5,150,105,.05);border:1px solid rgba(5,150,105,.15);border-radius:9px;padding:10px 13px;font-family:var(--sans);font-size:12px;color:var(--success);}
.pay-input{width:100%;padding:12px 15px;border:1px solid var(--border);border-radius:9px;font-size:13px;font-family:var(--sans);background:#fff;outline:none;transition:border-color .18s,box-shadow .18s;color:var(--text);margin-bottom:16px;}
.pay-input:focus{border-color:var(--navy);box-shadow:0 0 0 3px rgba(30,58,95,.07);}
.pay-input:disabled{background:var(--bg);color:var(--hint);}
.pay-input::placeholder{color:var(--hint);}

/* ── Success ── */
.succ-hero{background:linear-gradient(135deg,#064e3b 0%,#065f46 100%);border-radius:20px 20px 0 0;padding:34px 28px 26px;text-align:center;position:relative;overflow:hidden;}
.succ-hero::before{content:'';position:absolute;top:-30px;right:-30px;width:130px;height:130px;border-radius:50%;background:rgba(255,255,255,.05);}
.succ-hero::after{content:'';position:absolute;bottom:-20px;left:-20px;width:90px;height:90px;border-radius:50%;background:rgba(255,255,255,.04);}
.succ-icon{width:64px;height:64px;border-radius:50%;background:rgba(255,255,255,.14);border:2px solid rgba(255,255,255,.22);display:flex;align-items:center;justify-content:center;color:#fff;margin:0 auto 18px;position:relative;z-index:1;box-shadow:0 8px 24px rgba(0,0,0,.2);animation:succ-pop .5s .1s cubic-bezier(.16,1,.3,1) both;}
@keyframes succ-pop{from{transform:scale(.6);opacity:0}to{transform:scale(1);opacity:1}}
.succ-title{font-family:var(--serif);font-size:23px;font-weight:300;color:#fff;margin-bottom:7px;position:relative;z-index:1;}
.succ-sub{font-family:var(--sans);font-size:13px;color:rgba(255,255,255,.55);line-height:1.55;position:relative;z-index:1;max-width:300px;margin:0 auto;}
.succ-steps-wrap{background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:4px 16px;margin-bottom:2px;}
.succ-step{display:flex;align-items:center;gap:12px;font-family:var(--sans);font-size:13px;color:var(--text);padding:11px 0;border-bottom:1px solid var(--border);}
.succ-step:last-child{border-bottom:none;}
.succ-step-icon{width:28px;height:28px;border-radius:8px;background:rgba(5,150,105,.1);color:var(--success);display:flex;align-items:center;justify-content:center;flex-shrink:0;}

/* ── Confirm Dialog ── */
.confirm-overlay{position:fixed;inset:0;z-index:9998;background:rgba(10,18,35,.65);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:20px;animation:mFade .2s ease;}
.confirm-box{background:#fff;border-radius:18px;max-width:380px;width:100%;box-shadow:0 30px 70px rgba(0,0,0,.22),0 0 0 1px rgba(0,0,0,.05);animation:mSlide .3s cubic-bezier(.16,1,.3,1);overflow:hidden;}
.confirm-icon-wrap{padding:30px 28px 18px;text-align:center;}
.confirm-icon{width:56px;height:56px;border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;}
.confirm-icon.error{background:rgba(220,38,38,.1);color:var(--danger);}
.confirm-icon.warning{background:rgba(217,119,6,.1);color:var(--warning);}
.confirm-icon.info{background:rgba(2,132,199,.1);color:var(--info);}
.confirm-icon.success{background:rgba(5,150,105,.1);color:var(--success);}
.confirm-title{font-family:var(--serif);font-size:20px;font-weight:400;color:var(--text);margin-bottom:8px;}
.confirm-msg{font-family:var(--sans);font-size:13px;color:var(--hint);line-height:1.6;max-width:280px;margin:0 auto;}
.confirm-actions{padding:16px 22px 22px;display:flex;gap:10px;}
.confirm-btn{flex:1;padding:12px 16px;border-radius:10px;font-family:var(--sans);font-size:13px;font-weight:500;cursor:pointer;border:1px solid var(--border);background:var(--bg);color:var(--muted);transition:all .18s;text-align:center;}
.confirm-btn:hover{border-color:var(--hint);color:var(--text);}
.confirm-btn.primary{background:var(--danger);border-color:var(--danger);color:#fff;}
.confirm-btn.primary:hover{background:#b91c1c;border-color:#b91c1c;box-shadow:0 4px 14px rgba(220,38,38,.3);}
.confirm-btn.primary.warning{background:var(--warning);border-color:var(--warning);}
.confirm-btn.primary.warning:hover{background:#b45309;border-color:#b45309;}
.confirm-btn.primary.info{background:var(--info);border-color:var(--info);}
.confirm-btn.primary.info:hover{background:#0369a1;border-color:#0369a1;}

/* ── Provider Tabs ── */
.provider-btn{flex:1;padding:11px 8px;border-radius:10px;font-family:var(--sans);font-size:12px;font-weight:500;border:1.5px solid var(--border);background:var(--bg);color:var(--muted);cursor:pointer;transition:all .2s;text-align:center;}
.provider-btn:hover{border-color:var(--hint);color:var(--text);}
.provider-btn:disabled{opacity:.4;cursor:not-allowed;}
.provider-btn[data-active='true'].tigo{border-color:#00D4AA;background:rgba(0,212,170,.08);color:#008a6f;}
.provider-btn[data-active='true'].mpesa{border-color:#00C853;background:rgba(0,200,83,.08);color:#005c26;}
.provider-btn[data-active='true'].airtel{border-color:#FF6B35;background:rgba(255,107,53,.08);color:#c94212;}
.field-label{font-family:var(--sans);font-size:10px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--hint);margin-bottom:8px;display:block;}

@keyframes spin{to{transform:rotate(360deg)}}

/* ── Responsive ── */
@media(max-width:1100px){.pr-grid{grid-template-columns:repeat(2,minmax(0,1fr));}}
@media(max-width:768px){
  .ph-inner,.sb-inner,.pr-body{padding-left:16px;padding-right:16px;}
  .pr-grid{grid-template-columns:minmax(0,1fr);}
  .pr-grid.list .pc{flex-direction:column;}
  .pr-grid.list .pc-img-wrap{width:100%;aspect-ratio:4/3;}
  .adv.open{max-height:130px;}
  .adv-inner{padding:12px 16px 16px;}
  .sb-view-btns{display:none;}
  .m-box{border-radius:16px;}
  .toast-portal{top:16px;right:16px;left:16px;}
  .toast{min-width:0;width:100%;}
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

/* ─── Confirm Dialog ─── */
interface ConfirmConfig {
  type?: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}
const ConfirmDialog = ({ config, onConfirm, onCancel }: {
  config: ConfirmConfig; onConfirm: () => void; onCancel: () => void;
}) => {
  const type = config.type ?? 'warning';
  const ConfirmIcon = type === 'error' ? AlertCircle : type === 'info' ? Info : type === 'success' ? CheckCircle2 : AlertCircle;
  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-box" onClick={e => e.stopPropagation()}>
        <div className="confirm-icon-wrap">
          <div className={`confirm-icon ${type}`}><ConfirmIcon size={24} /></div>
          <div className="confirm-title">{config.title}</div>
          <div className="confirm-msg">{config.message}</div>
        </div>
        <div className="confirm-actions">
          <button className="confirm-btn" onClick={onCancel}>{config.cancelLabel ?? 'Cancel'}</button>
          <button className={`confirm-btn primary ${type}`} onClick={onConfirm}>{config.confirmLabel ?? 'Confirm'}</button>
        </div>
      </div>
    </div>
  );
};

/* ─── useToast hook ─── */
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

/* ─── useConfirm hook ─── */
function useConfirm() {
  const [config, setConfig] = useState<ConfirmConfig | null>(null);
  const resolveRef = useRef<((v: boolean) => void) | null>(null);
  const confirm = useCallback((cfg: ConfirmConfig): Promise<boolean> => {
    setConfig(cfg);
    return new Promise(res => { resolveRef.current = res; });
  }, []);
  const handleConfirm = () => { setConfig(null); resolveRef.current?.(true); };
  const handleCancel  = () => { setConfig(null); resolveRef.current?.(false); };
  return { config, confirm, handleConfirm, handleCancel };
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
  const loc  = property.location || property.address;
  const size = property.size ?? property.area;
  return (
    <Link to={`/property/${property.id}`} className="pc">
      <div className="pc-img-wrap">
        <img src={getImage(property)} alt={property.title} className="pc-img" />
        <div className="pc-img-overlay" />
        {property.featured && <div className="pc-badge-featured">Featured</div>}
        {property.type && <div className="pc-badge-type">{typeLabel[property.type] ?? property.type}</div>}
        <div className="pc-price-overlay">
          <div className="pc-price-main">{formatPrice(property.price)}</div>
          <div className="pc-price-period">/month</div>
        </div>
        {/* Share button on hover — top right of image */}
        <div className="pc-img-actions">
          <button className="pc-img-btn" onClick={e => { e.preventDefault(); e.stopPropagation(); navigator.clipboard.writeText(`${window.location.origin}/property/${property.id}`); }} title="Copy link">
            <Share2 size={14} />
          </button>
        </div>
      </div>
      <div className="pc-body">
        {loc && <div className="pc-location"><MapPin size={11} />{loc}</div>}
        <div className="pc-title">{property.title || 'Untitled Property'}</div>
        {property.description && <div className="pc-desc">{property.description}</div>}
        <div className="pc-specs">
          {property.bedrooms != null && (<><div className="pc-spec"><Bed size={13} />{property.bedrooms} bed{property.bedrooms !== 1 ? 's' : ''}</div><div className="pc-spec-div" /></>)}
          {property.bathrooms != null && (<><div className="pc-spec"><Bath size={13} />{property.bathrooms} bath{property.bathrooms !== 1 ? 's' : ''}</div>{size != null && <div className="pc-spec-div" />}</>)}
          {size != null && <div className="pc-spec"><Square size={13} />{size} m²</div>}
        </div>
        <div className="pc-footer">
          <div>{property.furnished && <span className="pc-tag">Furnished</span>}</div>
          <div className="pc-foot-actions">
            {/* ── Save Button ── */}
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

/* ─── 1. Auth Gate Modal ─── */
const AuthModal = ({ property, onClose, onLogin, onSignup }: {
  property: Property; onClose: () => void; onLogin: () => void; onSignup: () => void;
}) => (
  <Overlay onClose={onClose}>
    <div className="auth-hero">
      <button className="m-close" onClick={onClose}><X size={15} /></button>
      <div className="auth-hero-icon"><ShieldCheck size={24} /></div>
      <div className="auth-hero-title">Sign in to Apply</div>
      <div className="auth-hero-desc">You need an account to submit a rental application and connect with agents.</div>
      <div className="auth-prop-pill"><MapPin size={11} />Applying for <strong>{property.title}</strong></div>
    </div>
    <div className="m-body" style={{ paddingTop: 22 }}>
      <div style={{ fontFamily: 'var(--sans)', fontSize: 10, fontWeight: 600, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--hint)', marginBottom: 12 }}>Choose an option to continue</div>
      <div className="auth-opt" onClick={onLogin} role="button">
        <div className="auth-opt-icon login"><LogIn size={18} /></div>
        <div style={{ flex: 1 }}>
          <div className="auth-opt-main">Sign in to my account</div>
          <div className="auth-opt-sub">I already have an account</div>
        </div>
        <ArrowRight size={15} style={{ color: 'var(--hint)', flexShrink: 0 }} />
      </div>
      <div className="auth-divider">or</div>
      <div className="auth-opt" onClick={onSignup} role="button">
        <div className="auth-opt-icon signup"><UserPlus size={18} /></div>
        <div style={{ flex: 1 }}>
          <div className="auth-opt-main">Create a free account</div>
          <div className="auth-opt-sub">New here? Sign up takes under a minute</div>
        </div>
        <ArrowRight size={15} style={{ color: 'var(--hint)', flexShrink: 0 }} />
      </div>
    </div>
    <div className="m-footer" style={{ justifyContent: 'center', paddingTop: 8 }}>
      <button className="m-btn" onClick={onClose} style={{ fontSize: 12, color: 'var(--hint)' }}>Continue browsing</button>
    </div>
  </Overlay>
);

/* ─── 2. Apply Confirm Modal ─── */
const ApplyModal = ({ property, onClose, onProceed }: {
  property: Property; onClose: () => void; onProceed: () => void;
}) => (
  <Overlay onClose={onClose}>
    <div className="m-head-navy">
      <button className="m-close" onClick={onClose}><X size={15} /></button>
      <div className="m-head-title">Apply for Property</div>
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
        {property.furnished && <div className="prop-info-row"><CheckCircle2 size={12} style={{ color: 'var(--success)' }} /><strong style={{ color: 'var(--success)' }}>Furnished</strong></div>}
      </div>
      <div className="fee-block">
        <div className="fee-amount">TZS 20,000</div>
        <div className="fee-label">One-time service fee · non-refundable</div>
      </div>
      <p style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--muted)', lineHeight: 1.65 }}>
        This fee connects you directly with the property agent. Once paid, the agent is notified immediately and will reach out within 24 hours to arrange a viewing.
      </p>
    </div>
    <div className="m-footer">
      <button className="m-btn" onClick={onClose}>Cancel</button>
      <button className="m-btn m-btn-navy" onClick={onProceed}>Proceed to Payment <ArrowRight size={14} /></button>
    </div>
  </Overlay>
);

/* ─── 3. Payment Modal ─── */
const PaymentModal = ({ processing, onClose, onPay, phoneNumber, setPhoneNumber, paymentMethod, setPaymentMethod }: {
  processing: boolean; onClose: () => void; onPay: () => void;
  phoneNumber: string; setPhoneNumber: (value: string) => void;
  paymentMethod: 'tigo' | 'mpesa' | 'airtel'; setPaymentMethod: (value: 'tigo' | 'mpesa' | 'airtel') => void;
}) => (
  <Overlay onClose={() => !processing && onClose()}>
    <div className="m-head-navy">
      <button className="m-close" onClick={() => !processing && onClose()} style={{ opacity: processing ? .4 : 1, cursor: processing ? 'not-allowed' : 'pointer' }}><X size={15} /></button>
      <div className="m-head-title">Complete Payment</div>
      <div className="m-head-sub">Secure checkout · TZS 20,000</div>
    </div>
    <div className="m-body">
      <div className="fee-block">
        <div className="fee-amount">TZS 20,000</div>
        <div className="fee-label">Service fee for agent connection</div>
      </div>
      <label className="field-label">Mobile Money Provider</label>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {([
          { value: 'tigo',   label: 'Tigo Pesa' },
          { value: 'mpesa',  label: 'M-Pesa' },
          { value: 'airtel', label: 'Airtel Money' },
        ] as { value: 'tigo' | 'mpesa' | 'airtel'; label: string }[]).map(p => (
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
      <button className="m-btn m-btn-success" onClick={onPay} disabled={processing || !phoneNumber || phoneNumber.length < 10}>
        {processing
          ? <><Loader2 size={14} style={{ animation: 'spin .8s linear infinite' }} />Processing…</>
          : <>Pay TZS 20,000 <ArrowRight size={14} /></>
        }
      </button>
    </div>
  </Overlay>
);

/* ─── 4. Success Modal ─── */
const SuccessModal = ({ onClose }: { onClose: () => void }) => (
  <Overlay onClose={onClose}>
    <div className="succ-hero">
      <div className="succ-icon"><CheckCircle2 size={28} /></div>
      <div className="succ-title">Application Submitted!</div>
      <div className="succ-sub">Payment confirmed. The agent has been notified and will contact you shortly.</div>
    </div>
    <div className="m-body" style={{ paddingTop: 20 }}>
      <div className="succ-steps-wrap">
        {[
          { label: 'Application fee received & confirmed',     icon: <CheckCheck size={14} /> },
          { label: 'Agent notified instantly via SMS & email', icon: <Sparkles size={14} /> },
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

/* ─── Main ─── */
type ModalStep = 'none' | 'auth' | 'apply' | 'payment' | 'success';

const Properties = () => {
  const navigate = useNavigate();
  const [searchTerm,    setSearchTerm]   = useState('');
  const [selectedType,  setSelectedType] = useState('');
  const [priceRange,    setPriceRange]   = useState('');
  const [bedrooms,      setBedrooms]     = useState<number | undefined>();
  const [furnished,     setFurnished]    = useState<boolean | undefined>();
  const [page,          setPage]         = useState(1);
  const [loading,       setLoading]      = useState(true);
  const [loadingMore,   setLoadingMore]  = useState(false);
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
  const [paymentMethod, setPaymentMethod] = useState<'tigo' | 'mpesa' | 'airtel'>('tigo');
  const [phoneNumber,   setPhoneNumber]   = useState('');

  const { toasts, addToast, removeToast } = useToast();
  const { config: confirmConfig, confirm, handleConfirm, handleCancel } = useConfirm();
  void confirm;

  const debouncedSearch = useDebounce(searchTerm, 400);

  useEffect(() => { setPage(1); }, [debouncedSearch, selectedType, priceRange, bedrooms, furnished]);

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
    const p: Record<string, string> = { page: pageNum.toString() };
    if (debouncedSearch) p.search = debouncedSearch;
    if (selectedType)    p.type   = selectedType;
    if (priceRange === '0-500')    { p.min_price = '0';       p.max_price = '500000'; }
    if (priceRange === '500-1000') { p.min_price = '500000';  p.max_price = '1000000'; }
    if (priceRange === '1000+')    { p.min_price = '1000000'; }
    if (bedrooms)          p.bedrooms  = bedrooms.toString();
    if (furnished != null) p.furnished = furnished ? 'true' : 'false';
    return p;
  }, [debouncedSearch, selectedType, priceRange, bedrooms, furnished]);

  const loadProperties = useCallback(async (pageNum: number) => {
    try {
      pageNum === 1 ? setLoading(true) : setLoadingMore(true);
      setError('');
      const res   = await Api.getProperties(buildParams(pageNum));
      const items: Property[] = res.data?.data ?? res.data ?? [];
      const pag: Pagination | null = res.data?.pagination ?? null;
      setProperties(prev => pageNum === 1 ? items : [...prev, ...items]);
      setPagination(pag);
    } catch {
      setError('Failed to load properties. Please try again.');
      if (pageNum === 1) setProperties([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [buildParams]);

  useEffect(() => { loadProperties(page); }, [page, loadProperties]);

  const toggleSave = async (id: number, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    try {
      if (savedIds.has(id)) {
        await Api.unsaveProperty(id);
        setSavedIds(p => { const s = new Set(p); s.delete(id); return s; });
        addToast({ type: 'info', title: 'Removed from saved', duration: 3000 });
      } else {
        await Api.saveProperty(id);
        setSavedIds(p => new Set(p).add(id));
        addToast({ type: 'success', title: 'Property saved', message: 'You can view saved properties in your dashboard.', duration: 3500 });
      }
    } catch {
      addToast({ type: 'error', title: 'Action failed', message: 'Could not update saved properties. Please try again.' });
    }
  };

  const handleApply = (property: Property, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setSelProp(property);
    setModal(localStorage.getItem('token') ? 'apply' : 'auth');
  };

  const handleAuthLogin  = () => {
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
      };
      let paymentSuccessful = false;
      let transactionId: string | null = null;
      try {
        const paymentResponse = await SelcomService.initiateMobileMoneyPayment(paymentData);
        if (paymentResponse.success && paymentResponse.data?.transaction_id) {
          paymentSuccessful = true;
          transactionId = paymentResponse.data.transaction_id;
          addToast({ type: 'success', title: 'Payment initiated', message: `Check your ${paymentMethod.toUpperCase()} prompt to complete the payment. Ref: ${transactionId}`, duration: 8000 });
        } else {
          throw new Error(paymentResponse.message || 'Payment initiation failed');
        }
      } catch (selcomError: any) {
        throw new Error(selcomError?.message || 'Payment failed. Please check your phone number and try again.');
      }
      if (paymentSuccessful) {
        await Api.createApplication({ property_id: selProp.id, owner_id: selProp.owner?.id, service_fee: 20000, payment_status: 'paid', payment_method: paymentMethod, transaction_id: transactionId });
        try {
          await Api.createContract({ property_id: selProp.id, owner_id: selProp.owner?.id, tenant_id: tenantId, start_date: new Date().toISOString().split('T')[0], end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], rent_amount: selProp.price, status: 'pending_signature', payment_status: 'service_fee_paid', service_fee_transaction_id: transactionId });
        } catch (contractError) { console.warn('Contract creation failed:', contractError); }
        if (selProp.agent?.id) {
          try {
            await Api.notifyAgent({ agent_id: selProp.agent.id, property_id: selProp.id, tenant_id: tenantId, message: `Tenant paid service fee via ${paymentMethod.toUpperCase()} for: ${selProp.title}` });
          } catch (notifyError) { console.warn('Agent notification failed:', notifyError); }
        }
        setModal('success');
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
    setBedrooms(undefined); setFurnished(undefined);
  };

  const activeFilterCount = [selectedType, priceRange, bedrooms, furnished].filter(v => v != null && v !== '').length;
  const hasMore = pagination ? pagination.current_page < pagination.last_page : false;

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#F8FAFC', minHeight: '100vh' }}>
      <style>{CSS}</style>
      <ToastPortal toasts={toasts} onRemove={removeToast} />
      {confirmConfig && <ConfirmDialog config={confirmConfig} onConfirm={handleConfirm} onCancel={handleCancel} />}

      {/* Header */}
      <div className="ph">
        <div className="ph-inner">
          <div>
            <div className="ph-eyebrow">Browse listings</div>
            <h1 className="ph-title">Available<br /><em>Properties</em></h1>
          </div>
          <div className="ph-meta">
            {loading ? 'Fetching listings…'
              : pagination
                ? <><strong>{properties.length}</strong> of <strong>{pagination.total}</strong> listings</>
                : <><strong>{properties.length}</strong> listings found</>}
            {applications.length > 0 && (
              <div style={{ marginTop: 5, fontSize: 12, color: 'rgba(201,168,76,.8)' }}>
                {applications.length} active application{applications.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="sb">
        <div className="sb-inner">
          <div className="sb-search">
            <span className="sb-search-icon"><Search size={14} /></span>
            <input className="sb-input" type="text" placeholder="Location or property name…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            {searchTerm && <button className="sb-clear" onClick={() => setSearchTerm('')}><X size={13} /></button>}
          </div>
          <select className="sb-select" value={selectedType} onChange={e => setSelectedType(e.target.value)}>
            <option value="">All types</option>
            <option value="apartment">Apartment</option>
            <option value="house">House</option>
            <option value="studio">Studio</option>
            <option value="villa">Villa</option>
            <option value="commercial">Commercial</option>
          </select>
          <select className="sb-select" value={priceRange} onChange={e => setPriceRange(e.target.value)}>
            <option value="">All prices</option>
            <option value="0-500">Under 500K TZS</option>
            <option value="500-1000">500K – 1M TZS</option>
            <option value="1000+">Above 1M TZS</option>
          </select>
          <button className={`sb-filter-btn${showFilters ? ' active' : ''}`} onClick={() => setShowFilters(v => !v)}>
            <SlidersHorizontal size={13} /> Filters
            {activeFilterCount > 0 && <span className="sb-filter-count">{activeFilterCount}</span>}
            <ChevronDown size={11} style={{ transform: showFilters ? 'rotate(180deg)' : 'none', transition: 'transform .25s' }} />
          </button>
          <div className="sb-view-btns">
            <button className={`sb-view-btn${viewMode === 'grid' ? ' active' : ''}`} onClick={() => setViewMode('grid')} title="Grid"><LayoutGrid size={15} /></button>
            <button className={`sb-view-btn${viewMode === 'list' ? ' active' : ''}`} onClick={() => setViewMode('list')} title="List"><List size={15} /></button>
          </div>
        </div>
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

      {/* Listings */}
      <div className="pr-body">
        {error && (
          <div className="err-banner">
            {error}
            <button className="err-retry" onClick={() => loadProperties(1)}>Retry</button>
          </div>
        )}
        {loading ? (
          <div className={`pr-grid${viewMode === 'list' ? ' list' : ''}`}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : properties.length > 0 ? (
          <>
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
            {hasMore && (
              <div className="load-more">
                <button className="load-more-btn" disabled={loadingMore} onClick={() => setPage(prev => prev + 1)}>
                  {loadingMore ? 'Loading…' : `Load more · page ${(pagination?.current_page ?? 1) + 1} of ${pagination?.last_page}`}
                </button>
              </div>
            )}
          </>
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
      </div>

      {/* Modals */}
      {modal === 'auth'    && selProp && <AuthModal    property={selProp} onClose={closeModal} onLogin={handleAuthLogin} onSignup={handleAuthSignup} />}
      {modal === 'apply'   && selProp && <ApplyModal   property={selProp} onClose={closeModal} onProceed={() => setModal('payment')} />}
      {modal === 'payment' && selProp && (
        <PaymentModal processing={paying} onClose={closeModal} onPay={handlePay} phoneNumber={phoneNumber} setPhoneNumber={setPhoneNumber} paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} />
      )}
      {modal === 'success' && (
        <SuccessModal onClose={() => { closeModal(); navigate('/dashboard/tenant/applications'); }} />
      )}
    </div>
  );
};

export default Properties;