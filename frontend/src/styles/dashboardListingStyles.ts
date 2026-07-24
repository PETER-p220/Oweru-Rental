/** Shared browse-page styles (Properties, BnB stays) inside dashboard layout */
export const DASHBOARD_LISTING_CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;}
:root{
  --slate-100:#F1F5F9;--slate-200:#E2E8F0;--slate-400:#94A3B8;--slate-600:#475569;
  --slate-800:#1E293B;--slate-900:#0F172A;--white:#FFFFFF;
  --gold:#C89128;--gold-light:#D4A84B;--gold-pale:rgba(200,145,40,0.10);--gold-border:rgba(200,145,40,0.28);
  --sans:'DM Sans',system-ui,sans-serif;--r:12px;--r-sm:8px;
}
.dlp-page{font-family:var(--sans);background:var(--slate-100);min-height:100%;}
.dlp-ph{background:var(--slate-800);border-bottom:1px solid var(--slate-200);}
.dlp-ph-inner{max-width:1280px;margin:0 auto;padding:40px 32px 36px;display:flex;align-items:flex-end;justify-content:space-between;gap:20px;flex-wrap:wrap;}
.dlp-eyebrow{font-size:10px;font-weight:600;letter-spacing:.22em;text-transform:uppercase;color:var(--gold);margin-bottom:10px;display:inline-flex;align-items:center;gap:10px;background:var(--gold-pale);border:1px solid var(--gold-border);padding:4px 12px;border-radius:20px;}
.dlp-title{font-size:clamp(20px,3.5vw,28px);font-weight:800;line-height:1.15;letter-spacing:-.02em;color:var(--white);margin:0;}
.dlp-meta{font-size:13px;color:var(--slate-400);text-align:right;}
.dlp-meta strong{color:var(--gold);font-weight:600;}
.dlp-sb{background:var(--white);border-bottom:1px solid var(--slate-200);position:sticky;top:0;z-index:40;box-shadow:0 4px 24px rgba(0,0,0,.06);}
.dlp-sb-inner{max-width:1280px;margin:0 auto;padding:12px 32px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.dlp-search{flex:1;min-width:200px;display:flex;align-items:center;background:var(--slate-100);border:1px solid var(--slate-200);border-radius:var(--r-sm);overflow:hidden;}
.dlp-search:focus-within{border-color:var(--gold);}
.dlp-search-icon{padding:0 10px;color:var(--slate-400);display:flex;}
.dlp-input{flex:1;background:transparent;border:none;outline:none;color:var(--slate-900);font-family:var(--sans);font-size:13px;padding:10px 10px 10px 0;}
.dlp-input::placeholder{color:var(--slate-400);}
.dlp-body{max-width:1280px;margin:0 auto;padding:28px 32px 40px;}
.dlp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px;}
.dlp-card{background:var(--white);border:1px solid var(--slate-200);border-radius:var(--r);overflow:hidden;display:flex;flex-direction:column;transition:transform .2s,box-shadow .2s,border-color .2s;}
.dlp-card:hover{transform:translateY(-2px);box-shadow:0 12px 28px rgba(15,23,42,.10);border-color:var(--gold-border);}
.dlp-img{width:100%;height:200px;object-fit:cover;background:var(--slate-200);}
.dlp-card-body{padding:16px 18px 18px;display:flex;flex-direction:column;gap:8px;flex:1;}
.dlp-card-title{font-size:17px;font-weight:700;color:var(--slate-900);margin:0;line-height:1.3;}
.dlp-loc{display:flex;align-items:center;gap:5px;color:var(--slate-600);font-size:12px;}
.dlp-loc svg{color:var(--gold);}
.dlp-meta-row{display:flex;gap:12px;color:var(--slate-600);font-size:12px;flex-wrap:wrap;}
.dlp-price{font-size:18px;font-weight:800;color:var(--slate-900);}
.dlp-price span{font-size:12px;font-weight:500;color:var(--slate-400);}
.dlp-btn{margin-top:auto;width:100%;padding:11px;border:none;border-radius:var(--r-sm);background:var(--gold);color:var(--slate-900);font-weight:700;font-size:13px;cursor:pointer;font-family:var(--sans);}
.dlp-btn:hover{background:var(--gold-light);}
.dlp-empty{grid-column:1/-1;text-align:center;padding:64px 24px;background:var(--white);border:1px solid var(--slate-200);border-radius:var(--r);color:var(--slate-600);}
.dlp-err{background:#FFE4E6;border:1px solid rgba(220,38,38,.25);border-radius:var(--r-sm);padding:12px 16px;margin-bottom:20px;color:#DC2626;font-size:13px;}
@media(max-width:768px){.dlp-ph-inner,.dlp-sb-inner,.dlp-body{padding-left:16px;padding-right:16px;}}
`;
