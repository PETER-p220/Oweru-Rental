import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, MapPin, Bed, Bath, Square, Heart, Share2,
  SlidersHorizontal, X, ChevronDown, LayoutGrid, List,
  CreditCard, LogIn, UserPlus, ShieldCheck, CheckCircle2,
  ArrowRight, Loader2,
} from 'lucide-react';
import Api from '../services/api';
import SelcomService from '../services/selcom';

/* ─── Types ─── */
interface Pagination { current_page: number; last_page: number; per_page: number; total: number; }
interface Property {
  id: number; title: string; location?: string; address?: string;
  price: number; bedrooms?: number; bathrooms?: number; size?: number; area?: number;
  type?: string; featured?: boolean; furnished?: boolean; description?: string;
  images?: string[];
  owner?: { name?: string; first_name?: string; last_name?: string };
  agent?: { id?: number; name?: string; code?: string };
}

/* ─── Hooks ─── */
function useDebounce<T>(value: T, delay: number): T {
  const [d, setD] = useState(value);
  useEffect(() => { const t = setTimeout(() => setD(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return d;
}

/* ─── Helpers ─── */
const VITE_STORAGE = import.meta.env.VITE_API_URL?.replace('/api', '') ?? '';
const formatPrice = (p: number) =>
  new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(p);
const typeLabel: Record<string, string> = { apartment: 'Apartment', house: 'House', studio: 'Studio', villa: 'Villa', commercial: 'Commercial' };
const getImage = (p: Property) => {
  if (p.images?.length) { const i = p.images[0]; return i.startsWith('http') ? i : `${VITE_STORAGE}/storage/${i}`; }
  return '/api/placeholder/600/400';
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
  --success:#059669;--danger:#DC2626;
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
.pc-img-btn.saved{color:var(--danger);}
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
.pc-foot-btn{height:30px;border-radius:6px;border:1px solid var(--border);background:var(--bg);color:var(--muted);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .15s;padding:0 8px;}
.pc-foot-btn:hover{border-color:var(--navy);color:var(--navy);background:var(--navy-faint);}
.pc-foot-btn.saved{color:var(--danger);border-color:rgba(220,38,38,.3);background:rgba(220,38,38,.04);}
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

/* ── Modal System ── */
.m-overlay{position:fixed;inset:0;z-index:1000;background:rgba(10,18,35,.68);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:20px;animation:mFade .2s ease;}
@keyframes mFade{from{opacity:0}to{opacity:1}}
.m-box{background:var(--surface);border-radius:18px;max-width:460px;width:100%;max-height:92vh;overflow-y:auto;box-shadow:0 28px 72px rgba(0,0,0,.24);animation:mSlide .28s cubic-bezier(.16,1,.3,1);}
@keyframes mSlide{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
.m-head-navy{background:var(--navy);padding:22px 24px 18px;border-radius:18px 18px 0 0;position:relative;}
.m-head-title{font-family:var(--serif);font-size:21px;font-weight:300;color:#fff;margin-bottom:3px;letter-spacing:-.01em;}
.m-head-sub{font-family:var(--sans);font-size:12px;color:rgba(255,255,255,.5);}
.m-close{position:absolute;top:14px;right:14px;width:30px;height:30px;border-radius:8px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.15);color:rgba(255,255,255,.7);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .18s;}
.m-close:hover{background:rgba(255,255,255,.2);color:#fff;}
.m-body{padding:22px 24px 10px;}
.m-footer{padding:12px 24px 22px;display:flex;gap:10px;justify-content:flex-end;}
.m-btn{padding:10px 18px;border-radius:9px;font-family:var(--sans);font-size:13px;font-weight:500;cursor:pointer;transition:all .18s;border:1px solid var(--border);background:var(--bg);color:var(--muted);display:inline-flex;align-items:center;gap:7px;}
.m-btn:hover{border-color:var(--navy);color:var(--navy);background:var(--navy-faint);}
.m-btn:disabled{opacity:.5;cursor:not-allowed;}
.m-btn-navy{background:var(--navy);border-color:var(--navy);color:#fff;}
.m-btn-navy:hover{background:var(--navy-2);border-color:var(--navy-2);color:#fff;}
.m-btn-success{background:var(--success);border-color:var(--success);color:#fff;}
.m-btn-success:hover{background:#047857;border-color:#047857;color:#fff;}

/* ── Auth Modal ── */
.auth-hero{background:var(--navy);border-radius:18px 18px 0 0;padding:32px 28px 26px;text-align:center;position:relative;}
.auth-hero-icon{width:56px;height:56px;border-radius:16px;background:rgba(201,168,76,.15);border:1px solid rgba(201,168,76,.25);display:flex;align-items:center;justify-content:center;color:var(--gold);margin:0 auto 16px;}
.auth-hero-title{font-family:var(--serif);font-size:22px;font-weight:300;color:#fff;margin-bottom:6px;}
.auth-hero-desc{font-family:var(--sans);font-size:13px;color:rgba(255,255,255,.55);line-height:1.5;}
.auth-prop-pill{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);border-radius:8px;padding:8px 14px;margin-top:14px;font-family:var(--sans);font-size:12px;color:rgba(255,255,255,.6);}
.auth-prop-pill strong{color:#fff;}
.auth-opt{display:flex;align-items:center;gap:14px;padding:14px 16px;border:1px solid var(--border);border-radius:10px;cursor:pointer;transition:all .2s;margin-bottom:10px;background:var(--surface);}
.auth-opt:hover{border-color:var(--navy);background:var(--navy-faint);transform:translateX(3px);}
.auth-opt:last-child{margin-bottom:0;}
.auth-opt-icon{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.auth-opt-icon.login{background:var(--navy-faint);color:var(--navy);}
.auth-opt-icon.signup{background:rgba(5,150,105,.08);color:var(--success);}
.auth-opt-main{font-family:var(--sans);font-size:14px;font-weight:500;color:var(--text);}
.auth-opt-sub{font-family:var(--sans);font-size:11px;color:var(--hint);margin-top:2px;}
.auth-divider{display:flex;align-items:center;gap:12px;margin:16px 0;font-family:var(--sans);font-size:11px;color:var(--hint);}
.auth-divider::before,.auth-divider::after{content:'';flex:1;height:1px;background:var(--border);}

/* ── Prop Info Card ── */
.prop-info{background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:14px 16px;margin-bottom:18px;}
.prop-info-name{font-family:var(--serif);font-size:16px;font-weight:400;color:var(--navy);margin-bottom:10px;line-height:1.3;}
.prop-info-row{display:flex;align-items:center;gap:7px;font-family:var(--sans);font-size:12px;color:var(--muted);margin-bottom:5px;}
.prop-info-row:last-child{margin-bottom:0;}
.prop-info-row strong{color:var(--text);}

/* ── Fee Block ── */
.fee-block{background:var(--navy);border-radius:10px;padding:20px;margin:18px 0;text-align:center;position:relative;overflow:hidden;}
.fee-block::before{content:'';position:absolute;top:-24px;right:-24px;width:90px;height:90px;border-radius:50%;background:rgba(201,168,76,.1);}
.fee-amount{font-family:var(--serif);font-size:28px;font-weight:300;color:#fff;letter-spacing:-.01em;margin-bottom:4px;}
.fee-label{font-family:var(--sans);font-size:11px;color:rgba(255,255,255,.5);}

/* ── Payment ── */
.pay-method{display:flex;align-items:center;gap:12px;padding:14px 16px;border:1.5px solid var(--navy);border-radius:10px;background:var(--navy-faint);margin-bottom:14px;}
.pay-method-icon{width:42px;height:42px;border-radius:10px;background:var(--navy-faint);border:1px solid var(--navy-soft);display:flex;align-items:center;justify-content:center;color:var(--navy);}
.pay-method-name{font-family:var(--sans);font-size:13px;font-weight:600;color:var(--text);}
.pay-method-sub{font-family:var(--sans);font-size:11px;color:var(--hint);}
.pay-badge{margin-left:auto;background:var(--navy);color:#fff;font-family:var(--sans);font-size:9px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;padding:4px 8px;border-radius:4px;}
.pay-secure{display:flex;align-items:center;gap:8px;background:rgba(5,150,105,.05);border:1px solid rgba(5,150,105,.15);border-radius:8px;padding:10px 12px;font-family:var(--sans);font-size:12px;color:var(--success);}

/* ── Success ── */
.succ-hero{background:linear-gradient(135deg,#064e3b,#065f46);border-radius:18px 18px 0 0;padding:32px 28px 24px;text-align:center;}
.succ-icon{width:60px;height:60px;border-radius:50%;background:rgba(255,255,255,.12);border:2px solid rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;color:#fff;margin:0 auto 16px;}
.succ-title{font-family:var(--serif);font-size:22px;font-weight:300;color:#fff;margin-bottom:6px;}
.succ-sub{font-family:var(--sans);font-size:13px;color:rgba(255,255,255,.6);line-height:1.5;}
.succ-step{display:flex;align-items:center;gap:10px;font-family:var(--sans);font-size:13px;color:var(--text);padding:9px 0;border-bottom:1px solid var(--border);}
.succ-step:last-child{border-bottom:none;}

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
  .m-box{border-radius:14px;}
}
`;

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
  const loc = property.location || property.address;
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
        <div className="pc-img-actions">
          <button className={`pc-img-btn${isSaved ? ' saved' : ''}`} onClick={onSave} title={isSaved ? 'Unsave' : 'Save'}>
            <Heart size={14} fill={isSaved ? 'currentColor' : 'none'} />
          </button>
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
            <button className={`pc-foot-btn${isSaved ? ' saved' : ''}`} onClick={onSave}><Heart size={13} fill={isSaved ? 'currentColor' : 'none'} /></button>
            <button className="pc-foot-btn" onClick={e => { e.preventDefault(); e.stopPropagation(); navigator.clipboard.writeText(`${window.location.origin}/property/${property.id}`); }}><Share2 size={13} /></button>
            <button className="pc-foot-btn apply" onClick={onApply}>Apply Now</button>
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
          <div className="auth-opt-sub">I already have a Tera POS account</div>
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
      
      <div style={{ fontFamily: 'var(--sans)', fontSize: 10, fontWeight: 600, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--hint)', marginBottom: 10 }}>Mobile Money Provider</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          { value: 'tigo', label: 'Tigo Pesa', color: '#00D4AA' },
          { value: 'mpesa', label: 'M-Pesa', color: '#00C853' },
          { value: 'airtel', label: 'Airtel Money', color: '#FF6B35' }
        ].map(provider => (
          <button
            key={provider.value}
            className="m-btn"
            style={{
              flex: 1,
              padding: '10px 8px',
              fontSize: 11,
              fontWeight: 500,
              border: `2px solid ${paymentMethod === provider.value ? provider.color : 'var(--border)'}`,
              background: paymentMethod === provider.value ? `${provider.color}15` : 'var(--bg)',
              color: paymentMethod === provider.value ? provider.color : 'var(--muted)'
            }}
            onClick={() => setPaymentMethod(provider.value as 'tigo' | 'mpesa' | 'airtel')}
            disabled={processing}
          >
            {provider.label}
          </button>
        ))}
      </div>
      
      <div style={{ fontFamily: 'var(--sans)', fontSize: 10, fontWeight: 600, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--hint)', marginBottom: 8 }}>Phone Number</div>
      <input
        type="tel"
        placeholder="Enter your mobile money number (e.g., 0712345678)"
        value={phoneNumber}
        onChange={e => setPhoneNumber(e.target.value)}
        disabled={processing}
        style={{
          width: '100%',
          padding: '12px 14px',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          fontSize: '13px',
          fontFamily: 'var(--sans)',
          background: processing ? 'var(--bg)' : '#fff',
          outline: 'none',
          transition: 'border-color .18s',
          marginBottom: 16
        }}
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
      <div className="succ-title">Application Submitted</div>
      <div className="succ-sub">Payment confirmed. The agent has been notified and will contact you shortly.</div>
    </div>
    <div className="m-body" style={{ paddingTop: 20 }}>
      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '4px 16px' }}>
        {['Application fee received & confirmed', 'Agent notified instantly via SMS & email', 'Expect a call or message within 24 hours'].map((s, i) => (
          <div key={i} className="succ-step">
            <CheckCircle2 size={15} style={{ color: 'var(--success)', flexShrink: 0 }} />
            {s}
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
  const [searchTerm,   setSearchTerm]   = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [priceRange,   setPriceRange]   = useState('');
  const [bedrooms,     setBedrooms]     = useState<number | undefined>();
  const [furnished,    setFurnished]    = useState<boolean | undefined>();
  const [page,         setPage]         = useState(1);
  const [loading,      setLoading]      = useState(true);
  const [loadingMore,  setLoadingMore]  = useState(false);
  const [error,        setError]        = useState('');
  const [savedIds,     setSavedIds]     = useState(new Set<number>());
  const [applications, setApplications] = useState<any[]>([]);
  const [pagination,   setPagination]   = useState<Pagination | null>(null);
  const [viewMode,     setViewMode]     = useState<'grid' | 'list'>('grid');
  const [showFilters,  setShowFilters]  = useState(false);
  const [properties,   setProperties]   = useState<Property[]>([]);
  const [modal,        setModal]        = useState<ModalStep>('none');
  const [selProp,      setSelProp]      = useState<Property | null>(null);
  const [paying,       setPaying]       = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'tigo' | 'mpesa' | 'airtel'>('tigo');
  const [phoneNumber,   setPhoneNumber]   = useState('');

  const debouncedSearch = useDebounce(searchTerm, 400);

  useEffect(() => { setPage(1); }, [debouncedSearch, selectedType, priceRange, bedrooms, furnished]);

  useEffect(() => {
    (async () => {
      try { if (localStorage.getItem('token')) { const r = await Api.getTenantApplications(); setApplications(r.data || []); } }
      catch { /* silent */ }
    })();
  }, []);

  useEffect(() => {
    const p = sessionStorage.getItem('pendingApplication');
    if (p) { sessionStorage.removeItem('pendingApplication'); setTimeout(() => navigate(`/dashboard/tenant/applications?property=${p}`), 1200); }
  }, []);

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
      const res = await Api.getProperties(buildParams(pageNum));
      const items: Property[] = res.data?.data ?? res.data ?? [];
      const pag: Pagination | null = res.data?.pagination ?? null;
      setProperties(prev => pageNum === 1 ? items : [...prev, ...items]);
      setPagination(pag);
    } catch {
      setError('Failed to load properties. Please try again.');
      if (pageNum === 1) setProperties([]);
    } finally { setLoading(false); setLoadingMore(false); }
  }, [buildParams]);

  useEffect(() => { loadProperties(page); }, [page, loadProperties]);

  const toggleSave = async (id: number, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    try {
      if (savedIds.has(id)) { await Api.publicUnsaveProperty(id); setSavedIds(p => { const s = new Set(p); s.delete(id); return s; }); }
      else { await Api.publicSaveProperty(id); setSavedIds(p => new Set(p).add(id)); }
    } catch { /* silent */ }
  };

  /* Always show auth modal first if user is not logged in */
  const handleApply = (property: Property, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setSelProp(property);
    setModal(localStorage.getItem('token') ? 'apply' : 'auth');
  };

  const handleAuthLogin  = () => { if (selProp) sessionStorage.setItem('pendingApplication', selProp.id.toString()); navigate(`/login?redirect=/dashboard/tenant/applications?property=${selProp?.id}`); };
  const handleAuthSignup = () => { if (selProp) sessionStorage.setItem('pendingApplication', selProp.id.toString()); navigate(`/register?redirect=/dashboard/tenant/applications?property=${selProp?.id}`); };

  const handlePay = async () => {
    if (!selProp) return;
    
    // Validate phone number
    if (!phoneNumber || phoneNumber.length < 10) {
      alert('Please enter a valid phone number for mobile money payment');
      return;
    }
    
    setPaying(true);
    try {
      // Get user data safely
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const tenantId = user?.id;
      
      if (!tenantId) {
        throw new Error('User not authenticated');
      }

      // 📍 SELCOM PAYMENT PROCESSING
      const paymentData = {
        amount: 20000,
        property_id: selProp.id,
        tenant_id: tenantId,
        phone_number: phoneNumber,
        provider: paymentMethod,
        customer_email: user?.email,
        customer_name: user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.first_name || 'Customer'
      };

      let paymentSuccessful = false;
      let transactionId = null;
      
      try {
        // Call Selcom API for mobile money payment
        const paymentResponse = await SelcomService.initiateMobileMoneyPayment(paymentData);
        
        if (paymentResponse.success && paymentResponse.data?.transaction_id) {
          paymentSuccessful = true;
          transactionId = paymentResponse.data.transaction_id;
          
          // Show success message for mobile money initiation
          alert(`Payment initiated successfully! Please check your ${paymentMethod.toUpperCase()} to complete the payment. Transaction ID: ${transactionId}`);
        } else {
          throw new Error(paymentResponse.message || 'Payment initiation failed');
        }
      } catch (selcomError: any) {
        console.error('❌ Selcom payment error:', selcomError);
        throw new Error(selcomError?.message || 'Payment failed. Please check your phone number and try again.');
      }
      
      if (paymentSuccessful) {
        // Create application with payment
        await Api.createApplication({
          property_id: selProp.id,
          service_fee: 20000,
          payment_status: 'paid',
          payment_method: paymentMethod,
          transaction_id: transactionId
        });
        
        // Notify agent
        if (selProp.agent?.id) {
          try {
            await Api.notifyAgent({
              agent_id: selProp.agent.id,
              property_id: selProp.id,
              tenant_id: tenantId,
              message: `Tenant paid service fee via ${paymentMethod.toUpperCase()} for: ${selProp.title}`
            });
          } catch (notifyError) {
            console.warn('Agent notification failed:', notifyError);
          }
        }
        
        setModal('success');
      }
    } catch (error: any) {
      console.error('Payment failed:', error);
      alert(error?.message || 'Payment failed. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  const closeModal = () => { if (!paying) { setModal('none'); setSelProp(null); } };

  const clearFilters = () => { setSearchTerm(''); setSelectedType(''); setPriceRange(''); setBedrooms(undefined); setFurnished(undefined); };
  const activeFilterCount = [selectedType, priceRange, bedrooms, furnished].filter(v => v != null && v !== '').length;
  const hasMore = pagination ? pagination.current_page < pagination.last_page : false;

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#F8FAFC', minHeight: '100vh' }}>
      <style>{CSS}</style>

      {/* Header */}
      <div className="ph">
        <div className="ph-inner">
          <div>
            <div className="ph-eyebrow">Browse listings</div>
            <h1 className="ph-title">Available<br /><em>Properties</em></h1>
          </div>
          <div className="ph-meta">
            {loading ? 'Fetching listings…'
              : pagination ? <><strong>{properties.length}</strong> of <strong>{pagination.total}</strong> listings</>
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
              <option value="1">1+</option><option value="2">2+</option><option value="3">3+</option><option value="4">4+</option>
            </select>
            <select className="sb-select" style={{ minWidth: 130 }} value={furnished == null ? '' : furnished ? 'true' : 'false'} onChange={e => { const v = e.target.value; setFurnished(v === '' ? undefined : v === 'true'); }}>
              <option value="">Furnishing</option>
              <option value="true">Furnished</option><option value="false">Unfurnished</option>
            </select>
            {(activeFilterCount > 0 || searchTerm) && (
              <button className="adv-clear" onClick={clearFilters}><X size={11} /> Clear all</button>
            )}
          </div>
        </div>
      </div>

      {/* Listings */}
      <div className="pr-body">
        {error && <div className="err-banner">{error}<button className="err-retry" onClick={() => loadProperties(1)}>Retry</button></div>}
        {loading ? (
          <div className={`pr-grid${viewMode === 'list' ? ' list' : ''}`}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : properties.length > 0 ? (
          <>
            <div className={`pr-grid${viewMode === 'list' ? ' list' : ''}`}>
              {properties.map(p => (
                <PropertyCard key={p.id} property={p} isSaved={savedIds.has(p.id)}
                  onSave={e => toggleSave(p.id, e)} onApply={e => handleApply(p, e)} />
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

      {/* ── Modals ── */}
      {modal === 'auth'    && selProp && <AuthModal    property={selProp} onClose={closeModal} onLogin={handleAuthLogin} onSignup={handleAuthSignup} />}
      {modal === 'apply'   && selProp && <ApplyModal   property={selProp} onClose={closeModal} onProceed={() => setModal('payment')} />}
      {modal === 'payment' && selProp && <PaymentModal processing={paying} onClose={closeModal} onPay={handlePay} phoneNumber={phoneNumber} setPhoneNumber={setPhoneNumber} paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} />}
      {modal === 'success'            && <SuccessModal onClose={() => { closeModal(); navigate('/dashboard/tenant/applications'); }} />}
    </div>
  );
};

export default Properties;