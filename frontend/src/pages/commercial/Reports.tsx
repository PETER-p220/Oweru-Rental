import React, { useState, useEffect } from 'react';
import { FileText, Download, Filter, Search, DollarSign, Users, Eye, TrendingUp, TrendingDown, Zap, Plus } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

interface Report {
  id: number; title: string; type: string; period: string; generated_at: string; file_url?: string; data?: any;
}
interface Property { id: number; title: string; type: string; location: string; status: string; }

const reportTypes = [
  { value: 'revenue', label: 'Revenue', icon: <DollarSign className="w-4 h-4" />, color: 'emerald' },
  { value: 'bookings', label: 'Bookings', icon: <Users className="w-4 h-4" />, color: 'blue' },
  { value: 'performance', label: 'Performance', icon: <TrendingUp className="w-4 h-4" />, color: 'violet' },
  { value: 'analytics', label: 'Analytics', icon: <Eye className="w-4 h-4" />, color: 'amber' },
];

const periods = [
  { value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' }, { value: 'quarterly', label: 'Quarterly' }, { value: 'yearly', label: 'Yearly' },
];

const colorMap: Record<string, { bg: string; text: string; border: string; iconBg: string }> = {
  emerald: { bg: 'bg-emerald-400/10', text: 'text-emerald-400', border: 'border-emerald-400/25', iconBg: 'bg-emerald-400/10' },
  blue: { bg: 'bg-blue-400/10', text: 'text-blue-400', border: 'border-blue-400/25', iconBg: 'bg-blue-400/10' },
  violet: { bg: 'bg-violet-400/10', text: 'text-violet-400', border: 'border-violet-400/25', iconBg: 'bg-violet-400/10' },
  amber: { bg: 'bg-amber-400/10', text: 'text-amber-400', border: 'border-amber-400/25', iconBg: 'bg-amber-400/10' },
};

const getTypeInfo = (type: string) => reportTypes.find(t => t.value === type) || reportTypes[0];

const Reports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [selType, setSelType] = useState('');
  const [selPeriod, setSelPeriod] = useState('');
  const [selProperty, setSelProperty] = useState('');

  useEffect(() => {
    fetchReports();
    fetchProperties();
  }, []);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/commercial/reports`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      if (res.ok) setReports(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchProperties = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/commercial/properties?per_page=100`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      if (res.ok) { const d = await res.json(); setProperties(d.data); }
    } catch (e) { console.error(e); }
  };

  const generateReport = async (type: string, period: string, propertyId?: number) => {
    if (!type || !period) return;
    setGenerating(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ type, period, ...(propertyId && { property_id: propertyId.toString() }) });
      const res = await fetch(`${API_BASE}/api/commercial/reports/generate?${params}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      if (res.ok) { const nr = await res.json(); setReports(p => [nr, ...p]); }
    } catch (e) { console.error(e); }
    finally { setGenerating(false); }
  };

  const downloadReport = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/commercial/reports/${id}/download`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `report-${id}.pdf`;
        document.body.appendChild(a); a.click();
        window.URL.revokeObjectURL(url); document.body.removeChild(a);
      }
    } catch (e) { console.error(e); }
  };

  const formatDate = (s: string) => new Date(s).toLocaleDateString('en-TZ', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const filtered = reports.filter(r => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || r.type === typeFilter;
    const matchPeriod = periodFilter === 'all' || r.period === periodFilter;
    return matchSearch && matchType && matchPeriod;
  });

  if (loading) return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#C89128] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#4A5568] text-sm">Loading reports…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5 sm:space-y-6">

        {/* Header */}
        <div>
          <p className="text-xs font-semibold tracking-widest text-[#C89128] uppercase mb-1">Business</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Reports</h1>
          <p className="text-slate-400 text-sm mt-0.5">Generate and download business reports</p>
        </div>

        {/* Quick Generate — Mobile: stack, Desktop: row */}
        <div className="bg-[#162035] border border-[#1E2D4A] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1E2D4A] flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#C89128]" />
            <h2 className="text-base font-semibold text-white">Quick Generate</h2>
          </div>

          {/* One-click shortcuts */}
          <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 border-b border-[#1E2D4A]">
            {reportTypes.map(rt => {
              const c = colorMap[rt.color];
              return (
                <button key={rt.value} onClick={() => generateReport(rt.value, 'monthly')} disabled={generating}
                  className={`flex flex-col items-center gap-2 p-4 bg-[#1E2D4A]/60 border border-[#1E2D4A] rounded-xl hover:border-[#C89128]/30 transition-all disabled:opacity-50 group`}>
                  <div className={`w-9 h-9 ${c.iconBg} rounded-xl flex items-center justify-center ${c.text}`}>{rt.icon}</div>
                  <div className="text-center">
                    <p className="text-white text-xs font-medium">{rt.label}</p>
                    <p className="text-slate-500 text-[10px] mt-0.5">Monthly</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Custom generate */}
          <div className="p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Custom Report</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select value={selType} onChange={e => setSelType(e.target.value)}
                className="px-4 py-2.5 bg-[#1E2D4A] border border-[#1E2D4A] rounded-xl text-white text-sm focus:outline-none focus:border-[#C89128] transition-colors">
                <option value="">Report Type</option>
                {reportTypes.map(t => <option key={t.value} value={t.value}>{t.label} Report</option>)}
              </select>
              <select value={selPeriod} onChange={e => setSelPeriod(e.target.value)}
                className="px-4 py-2.5 bg-[#1E2D4A] border border-[#1E2D4A] rounded-xl text-white text-sm focus:outline-none focus:border-[#C89128] transition-colors">
                <option value="">Period</option>
                {periods.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
              <select value={selProperty} onChange={e => setSelProperty(e.target.value)}
                className="px-4 py-2.5 bg-[#1E2D4A] border border-[#1E2D4A] rounded-xl text-white text-sm focus:outline-none focus:border-[#C89128] transition-colors">
                <option value="">All Properties</option>
                {properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
            <button
              onClick={() => generateReport(selType, selPeriod, selProperty ? parseInt(selProperty) : undefined)}
              disabled={!selType || !selPeriod || generating}
              className="mt-3 flex items-center gap-2 px-5 py-2.5 bg-[#C89128] text-[#0F172A] rounded-xl font-semibold text-sm hover:bg-[#D4A843] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[#C89128]/20"
            >
              {generating
                ? <><div className="w-4 h-4 border-2 border-[#0F172A]/30 border-t-[#0F172A] rounded-full animate-spin" />Generating…</>
                : <><FileText className="w-4 h-4" />Generate Report</>}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[#162035] border border-[#1E2D4A] rounded-2xl p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <div className="relative sm:col-span-1 lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input type="text" placeholder="Search reports…" value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-[#1E2D4A] border border-[#1E2D4A] rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#C89128] transition-colors" />
            </div>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              className="px-4 py-2.5 bg-[#1E2D4A] border border-[#1E2D4A] rounded-xl text-white text-sm focus:outline-none focus:border-[#C89128]">
              <option value="all">All Types</option>
              {reportTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <select value={periodFilter} onChange={e => setPeriodFilter(e.target.value)}
              className="px-4 py-2.5 bg-[#1E2D4A] border border-[#1E2D4A] rounded-xl text-white text-sm focus:outline-none focus:border-[#C89128]">
              <option value="all">All Periods</option>
              {periods.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <p className="text-xs text-slate-500 mt-3">{filtered.length} {filtered.length === 1 ? 'report' : 'reports'}</p>
        </div>

        {/* Reports */}
        {filtered.length === 0 ? (
          <div className="bg-[#162035] border border-[#1E2D4A] rounded-2xl py-16 text-center">
            <div className="w-16 h-16 bg-[#1E2D4A] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-slate-600" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">No reports found</h3>
            <p className="text-slate-400 text-sm">Generate your first report above</p>
          </div>
        ) : (
          <>
            {/* Mobile: cards */}
            <div className="space-y-3 sm:hidden">
              {filtered.map(r => {
                const info = getTypeInfo(r.type);
                const c = colorMap[info.color];
                return (
                  <div key={r.id} className="bg-[#162035] border border-[#1E2D4A] rounded-2xl p-4 hover:border-[#C89128]/20 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 ${c.iconBg} rounded-xl flex items-center justify-center flex-shrink-0 ${c.text}`}>{info.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{r.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">#{r.id}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border ${c.bg} ${c.text} ${c.border}`}>{info.label}</span>
                          <span className="text-[10px] text-slate-500">{periods.find(p => p.value === r.period)?.label}</span>
                          <span className="text-[10px] text-slate-500">{formatDate(r.generated_at)}</span>
                        </div>
                      </div>
                      <button onClick={() => downloadReport(r.id)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-[#C89128]/10 text-[#C89128] border border-[#C89128]/20 rounded-xl text-xs font-medium hover:bg-[#C89128]/20 transition-colors flex-shrink-0">
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop: table */}
            <div className="hidden sm:block bg-[#162035] border border-[#1E2D4A] rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#1E2D4A]">
                      {['Report', 'Type', 'Period', 'Generated', ''].map((h, i) => (
                        <th key={i} className={`px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide ${i === 4 ? 'text-right' : 'text-left'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E2D4A]">
                    {filtered.map(r => {
                      const info = getTypeInfo(r.type);
                      const c = colorMap[info.color];
                      return (
                        <tr key={r.id} className="hover:bg-[#1E2D4A]/30 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 ${c.iconBg} rounded-xl flex items-center justify-center ${c.text} flex-shrink-0`}>{info.icon}</div>
                              <div>
                                <p className="text-sm font-medium text-white">{r.title}</p>
                                <p className="text-xs text-slate-500">#{r.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${c.bg} ${c.text} ${c.border}`}>
                              {info.icon && <span className="w-3 h-3 flex items-center justify-center">{info.icon}</span>}
                              {info.label}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-300">{periods.find(p => p.value === r.period)?.label || r.period}</td>
                          <td className="px-5 py-4 text-sm text-slate-400">{formatDate(r.generated_at)}</td>
                          <td className="px-5 py-4 text-right">
                            <button onClick={() => downloadReport(r.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#C89128]/10 text-[#C89128] border border-[#C89128]/20 rounded-xl text-xs font-medium hover:bg-[#C89128]/20 transition-colors">
                              <Download className="w-3.5 h-3.5" />Download
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default Reports;