import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Eye, DollarSign, Users, Activity, BarChart3, PieChart, Calendar, Zap, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

interface AnalyticsData {
  total_properties: number;
  active_properties: number;
  total_bookings: number;
  total_revenue: number;
  average_rating: number;
  occupancy_rate: number;
  monthly_revenue: Array<{ month: string; revenue: number }>;
  property_performance: Array<{ id: number; title: string; views: number; bookings: number; revenue: number; rating: number }>;
  booking_trends: Array<{ month: string; bookings: number; revenue: number }>;
}

const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('6months');

  useEffect(() => { fetchAnalytics(); }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/commercial/analytics?range=${timeRange}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      if (response.ok) setData(await response.json());
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
  const fmtPct = (n: number) => `${n.toFixed(1)}%`;

  const metrics = [
    { label: 'Total Revenue', value: fmt(data?.total_revenue || 0), icon: <DollarSign className="w-5 h-5" />, change: 23.5, color: 'emerald' },
    { label: 'Total Bookings', value: data?.total_bookings || 0, icon: <Users className="w-5 h-5" />, change: 15.2, color: 'blue' },
    { label: 'Occupancy Rate', value: fmtPct(data?.occupancy_rate || 0), icon: <Activity className="w-5 h-5" />, change: 5.8, color: 'violet' },
    { label: 'Avg. Rating', value: (data?.average_rating || 0).toFixed(1), icon: <TrendingUp className="w-5 h-5" />, change: 2.1, color: 'amber' },
  ];

  const colorMap: Record<string, string> = {
    emerald: 'text-emerald-400 bg-emerald-400/10',
    blue: 'text-blue-400 bg-blue-400/10',
    violet: 'text-violet-400 bg-violet-400/10',
    amber: 'text-amber-400 bg-amber-400/10',
  };

  const maxRev = Math.max(...(data?.monthly_revenue?.map(m => m.revenue) || [1]), 1);
  const maxBook = Math.max(...(data?.booking_trends?.map(t => t.bookings) || [1]), 1);
  const bestMonth = data?.booking_trends?.reduce((mx, t) => t.bookings > mx.bookings ? t : mx, { month: '—', bookings: 0 });
  const avgBookingValue = (data?.total_revenue || 0) / Math.max(data?.total_bookings || 1, 1);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#C89128] border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Loading analytics…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <style>{`
        .bar-wrap:hover .bar-tip { opacity:1; }
        .bar-tip { opacity:0; transition: opacity .15s; pointer-events:none; }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-widest text-[#C89128] uppercase mb-1">Insights</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Analytics</h1>
            <p className="text-slate-400 text-sm mt-0.5">Track your commercial property performance</p>
          </div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2.5 bg-[#162035] border border-[#1E2D4A] rounded-xl text-white text-sm focus:outline-none focus:border-[#C89128] self-start sm:self-auto"
          >
            <option value="1month">Last Month</option>
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last Year</option>
          </select>
        </div>

        {/* ── Key Metrics ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {metrics.map((m, i) => (
            <div key={i} className="bg-[#162035] border border-[#1E2D4A] rounded-2xl p-4 hover:border-[#C89128]/30 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-xl ${colorMap[m.color]}`}>{m.icon}</div>
                <span className={`flex items-center gap-0.5 text-xs font-semibold ${m.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {m.change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(m.change)}%
                </span>
              </div>
              <p className="text-lg sm:text-xl font-bold text-white">{m.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{m.label}</p>
              <p className="text-[10px] text-slate-600 mt-0.5">vs last period</p>
            </div>
          ))}
        </div>

        {/* ── Charts Row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

          {/* Revenue Trend */}
          <div className="bg-[#162035] border border-[#1E2D4A] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1E2D4A] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#C89128]" />
                <h2 className="text-base font-semibold text-white">Revenue Trend</h2>
              </div>
              <span className="text-xs text-slate-500">{fmt(data?.monthly_revenue?.reduce((s, m) => s + m.revenue, 0) || 0)}</span>
            </div>
            <div className="p-5">
              <div className="h-44 sm:h-52 flex items-end gap-1.5 sm:gap-2">
                {(data?.monthly_revenue || []).map((m, i) => {
                  const pct = Math.max((m.revenue / maxRev) * 100, 4);
                  return (
                    <div key={i} className="bar-wrap flex-1 flex flex-col items-center relative" style={{ height: '100%', justifyContent: 'flex-end' }}>
                      <div className="bar-tip absolute -top-10 left-1/2 -translate-x-1/2 bg-[#0F172A] border border-[#1E2D4A] rounded-lg px-2 py-1 text-[10px] text-white whitespace-nowrap z-10 shadow-lg">
                        {fmt(m.revenue)}
                      </div>
                      <div
                        className="w-full rounded-t-lg bg-gradient-to-t from-[#C89128]/70 to-[#C89128]/20 border-t border-[#C89128]/50 cursor-pointer"
                        style={{ height: `${pct}%` }}
                      />
                      <span className="text-[10px] text-slate-500 mt-1.5">{m.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Top Properties */}
          <div className="bg-[#162035] border border-[#1E2D4A] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1E2D4A] flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[#C89128]" />
              <h2 className="text-base font-semibold text-white">Top Properties</h2>
            </div>
            <div className="divide-y divide-[#1E2D4A]">
              {(data?.property_performance?.slice(0, 5) || []).map((p, i) => (
                <div key={p.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-[#1E2D4A]/40 transition-colors">
                  <div className="w-8 h-8 bg-[#C89128]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-[#C89128]">{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{p.title}</p>
                    <p className="text-xs text-slate-400">{p.views} views</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-[#C89128]">{fmt(p.revenue)}</p>
                    <p className="text-[10px] text-slate-500">{p.bookings} bookings</p>
                  </div>
                </div>
              ))}
              {!data?.property_performance?.length && (
                <div className="py-10 text-center"><p className="text-slate-500 text-sm">No data yet</p></div>
              )}
            </div>
          </div>
        </div>

        {/* ── Booking Trends ── */}
        <div className="bg-[#162035] border border-[#1E2D4A] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1E2D4A] flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#C89128]" />
            <h2 className="text-base font-semibold text-white">Booking Trends</h2>
          </div>
          <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar chart */}
            <div>
              <p className="text-sm font-medium text-white mb-4">Monthly Bookings</p>
              <div className="h-40 flex items-end gap-1.5 sm:gap-2">
                {(data?.booking_trends || []).map((t, i) => {
                  const pct = Math.max((t.bookings / maxBook) * 100, 4);
                  return (
                    <div key={i} className="bar-wrap flex-1 flex flex-col items-center relative" style={{ height: '100%', justifyContent: 'flex-end' }}>
                      <div className="bar-tip absolute -top-9 left-1/2 -translate-x-1/2 bg-[#0F172A] border border-[#1E2D4A] rounded-lg px-2 py-1 text-[10px] text-white whitespace-nowrap z-10 shadow-lg">
                        {t.bookings}
                      </div>
                      <div
                        className="w-full rounded-t-lg bg-gradient-to-t from-blue-500/50 to-blue-500/15 border-t border-blue-500/40 cursor-pointer"
                        style={{ height: `${pct}%` }}
                      />
                      <span className="text-[10px] text-slate-500 mt-1.5">{t.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Insights */}
            <div>
              <p className="text-sm font-medium text-white mb-4">Key Insights</p>
              <div className="space-y-3">
                {[
                  { dot: 'bg-emerald-400', title: 'Peak Performance', desc: `Best month: ${bestMonth?.month}`, icon: <Zap className="w-3.5 h-3.5" /> },
                  { dot: 'bg-amber-400', title: 'Growth Opportunity', desc: 'Boost marketing in slower months', icon: <TrendingUp className="w-3.5 h-3.5" /> },
                  { dot: 'bg-blue-400', title: 'Avg. Booking Value', desc: fmt(avgBookingValue), icon: <DollarSign className="w-3.5 h-3.5" /> },
                ].map((ins, i) => (
                  <div key={i} className="flex items-start gap-3 p-3.5 bg-[#1E2D4A]/50 rounded-xl">
                    <div className={`w-2 h-2 ${ins.dot} rounded-full mt-1.5 flex-shrink-0`} />
                    <div>
                      <p className="text-sm font-medium text-white">{ins.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{ins.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Analytics;