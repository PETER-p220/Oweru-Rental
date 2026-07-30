import { useState, useEffect, useCallback } from 'react';
import { Calendar, Users, MessageSquare, Phone, Mail, Home, X, CheckCircle, XCircle, Clock, RefreshCw, ChevronDown, Eye, CalendarDays, Table2 } from 'lucide-react';
import Api from '../../services/api';
import BnbAvailabilityCalendar from '../../components/bnb/BnbAvailabilityCalendar';

interface Booking {
  id: number;
  property_id: number;
  property?: {
    id: number;
    title: string;
    location?: string;
  };
  guest?: {
    id: number;
    name: string;
    email: string;
  };
  guest_id: number | null;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_status: string;
  special_requests?: string[] | null;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ─── Parse guest info from public booking notes ─────────────────────────────
// Notes format: "Public booking by: Peter Mushi (jeremieh@gmail.com, 0616012915)"
function parseGuestFromNotes(notes?: string): { name: string; email: string; phone: string } | null {
  if (!notes) return null;
  // Match: "by: NAME (EMAIL, PHONE)"
  const match = notes.match(/by:\s*(.+?)\s*\(([^,]+),\s*([^)]+)\)/);
  if (match) {
    return {
      name:  match[1].trim(),
      email: match[2].trim(),
      phone: match[3].trim(),
    };
  }
  // Fallback: just grab name after "by:"
  const nameMatch = notes.match(/by:\s*(.+)/);
  if (nameMatch) return { name: nameMatch[1].trim(), email: '', phone: '' };
  return null;
}

function getGuestInfo(booking: Booking) {
  if (booking.guest) {
    return { name: booking.guest.name, email: booking.guest.email, phone: '' };
  }
  const parsed = parseGuestFromNotes(booking.notes);
  if (parsed) return parsed;
  return { name: 'Guest', email: '', phone: '' };
}

function getNights(checkIn: string, checkOut: string): number {
  const a = new Date(checkIn);
  const b = new Date(checkOut);
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / 86_400_000));
}

/* ─── TOKENS ─────────────────────────────────────────── */
/* Same warm-paper / brass identity as the properties page */
const t = {
  gold:     '#8B5E34', // brass accent
  goldLt:   '#7A5230', // deeper brass for text on light tinted chips
  bg:       '#FAF9F6', // page background
  surface:  '#FFFFFF', // card background
  surface2: '#F4F1EA', // inset surface: inputs, modal shells, info tiles
  ink:      '#1C1917', // primary text
  onAccent: '#FFFFFF', // text placed on solid brass/accent backgrounds
  muted:    '#78716C',
  border:   '#E7E2D9',
  green:    '#2F6844',
  red:      '#9F1D1D',
  blue:     '#33448C',
  orange:   '#92400E',
} as const;

const body: React.CSSProperties  = { fontFamily: 'Inter, sans-serif' };
const serif: React.CSSProperties = { fontFamily: 'Fraunces, Georgia, serif' };
const card: React.CSSProperties  = { backgroundColor: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 2px rgba(28,25,23,0.04)' };

// ─── Status config ───────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: t.orange, icon: Clock       },
  confirmed: { label: 'Confirmed', color: t.green,  icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: t.red,    icon: XCircle     },
  completed: { label: 'Completed', color: t.gold,   icon: CheckCircle },
} as const;

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending:   ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled'],
  cancelled: [],
  completed: [],
};

// ─── Status Badge ────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? {
    label: status, color: t.muted, icon: Clock,
  };
  const Icon = cfg.icon;
  return (
    <span style={{
      ...body,
      display:        'inline-flex',
      alignItems:     'center',
      gap:            5,
      padding:        '4px 10px',
      borderRadius:   20,
      fontSize:       11,
      fontWeight:     600,
      letterSpacing:  '0.04em',
      textTransform:  'uppercase',
      background:     `${cfg.color}18`,
      color:          cfg.color,
      border:         `1px solid ${cfg.color}30`,
      whiteSpace:     'nowrap',
    }}>
      <Icon size={11} />
      {cfg.label}
    </span>
  );
};

// ─── Status Updater ──────────────────────────────────────────────────────────
const StatusUpdater = ({
  booking,
  onUpdate,
}: {
  booking: Booking;
  onUpdate: (id: number, status: string) => Promise<void>;
}) => {
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const transitions = ALLOWED_TRANSITIONS[booking.status] ?? [];

  if (transitions.length === 0) return null;

  const handle = async (newStatus: string) => {
    setOpen(false);
    setLoading(true);
    try {
      await onUpdate(booking.id, newStatus);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        disabled={loading}
        style={{
          ...body,
          display:      'flex',
          alignItems:   'center',
          gap:          6,
          padding:      '6px 12px',
          background:   loading ? t.surface2 : `${t.gold}18`,
          border:       `1px solid ${t.gold}30`,
          borderRadius: 6,
          color:        t.goldLt,
          fontSize:     12,
          fontWeight:   600,
          cursor:       loading ? 'wait' : 'pointer',
          transition:   'all 0.15s',
          whiteSpace:   'nowrap',
        }}
      >
        {loading ? <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> : null}
        Update
        <ChevronDown size={12} style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 0.2s' }} />
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position:    'absolute',
            top:         'calc(100% + 6px)',
            right:       0,
            background:  t.surface,
            border:      `1px solid ${t.border}`,
            borderRadius: 8,
            overflow:    'hidden',
            zIndex:      200,
            minWidth:    130,
            boxShadow:   '0 8px 24px rgba(28,25,23,0.16)',
          }}
        >
          {transitions.map((s) => {
            const cfg = STATUS_CONFIG[s as keyof typeof STATUS_CONFIG];
            const Icon = cfg.icon;
            return (
              <button
                key={s}
                onClick={() => handle(s)}
                style={{
                  ...body,
                  display:     'flex',
                  alignItems:  'center',
                  gap:         8,
                  width:       '100%',
                  padding:     '10px 14px',
                  background:  'none',
                  border:      'none',
                  color:       cfg.color,
                  fontSize:    13,
                  fontWeight:  500,
                  cursor:      'pointer',
                  textAlign:   'left',
                  transition:  'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = `${cfg.color}18`)}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                <Icon size={13} />
                Mark {cfg.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Detail Modal (the "card view" a row expands into) ──────────────────────
const DetailModal = ({
  booking,
  onClose,
  onUpdate,
}: {
  booking: Booking;
  onClose: () => void;
  onUpdate: (id: number, status: string) => Promise<void>;
}) => {
  const guest   = getGuestInfo(booking);
  const nights  = getNights(booking.check_in, booking.check_out);

  const row = (label: string, value: React.ReactNode, icon?: React.ReactNode) => (
    <div style={{
      display:       'grid',
      gridTemplateColumns: '110px 1fr',
      gap:           12,
      padding:       '10px 0',
      borderBottom:  `1px solid ${t.border}`,
      alignItems:    'start',
    }}>
      <span style={{ fontSize: 12, color: t.muted, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
        {icon}{label}
      </span>
      <span style={{ fontSize: 14, color: t.ink }}>{value}</span>
    </div>
  );

  return (
    <div
      style={{
        position:       'fixed',
        inset:          0,
        background:     'rgba(28,25,23,0.6)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        zIndex:         1000,
        backdropFilter: 'blur(4px)',
        padding:        20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          ...card,
          padding:      28,
          maxWidth:     520,
          width:        '100%',
          maxHeight:    '85vh',
          overflow:     'auto',
          position:     'relative',
          animation:    'fadeIn 0.25s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: t.gold, marginBottom: 4 }}>
              Booking #{booking.id}
            </div>
            <h2 style={{ ...serif, margin: 0, fontSize: 20, fontWeight: 600, color: t.ink }}>
              {booking.property?.title || `Property #${booking.property_id}`}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: t.muted, cursor: 'pointer', padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Status row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, padding: '12px 16px', background: t.surface2, borderRadius: 10, border: `1px solid ${t.border}` }}>
          <StatusBadge status={booking.status} />
          <StatusUpdater booking={booking} onUpdate={onUpdate} />
        </div>

        {/* Details */}
        <div>
          {row('Property',   booking.property?.title || `#${booking.property_id}`, <Home size={12} />)}
          {row('Guest',      guest.name,  <Users size={12} />)}
          {guest.email && row('Email',    <a href={`mailto:${guest.email}`} style={{ color: t.gold, textDecoration: 'none' }}>{guest.email}</a>, <Mail size={12} />)}
          {guest.phone && row('Phone',    <a href={`tel:${guest.phone}`}   style={{ color: t.gold, textDecoration: 'none' }}>{guest.phone}</a>, <Phone size={12} />)}
          {row('Check-in',   new Date(booking.check_in).toLocaleDateString('en-TZ', { year: 'numeric', month: 'long', day: 'numeric' }), <Calendar size={12} />)}
          {row('Check-out',  new Date(booking.check_out).toLocaleDateString('en-TZ', { year: 'numeric', month: 'long', day: 'numeric' }), <Calendar size={12} />)}
          {row('Duration',   `${nights} night${nights !== 1 ? 's' : ''}`)}
          {row('Guests',     `${booking.guests} guest${booking.guests !== 1 ? 's' : ''}`, <Users size={12} />)}
          {row('Amount',
            <span style={{ ...serif, color: t.green, fontWeight: 700, fontSize: 16 }}>
              {new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0 }).format(booking.total_price)}
            </span>
          )}
          {row('Payment',    <StatusBadge status={booking.payment_status} />)}
          {booking.special_requests && booking.special_requests.length > 0 &&
            row('Requests', booking.special_requests.join(', '), <MessageSquare size={12} />)
          }
          {row('Submitted',  new Date(booking.created_at).toLocaleDateString('en-TZ', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }))}
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
const BnbBookings = () => {
  const [bookings,       setBookings]       = useState<Booking[]>([]);
  const [properties,     setProperties]     = useState<Array<{ id: number; title: string }>>([]);
  const [loading,        setLoading]        = useState(true);
  const [searchTerm,     setSearchTerm]     = useState('');
  const [statusFilter,   setStatusFilter]   = useState('all');
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | ''>('');
  const [viewMode,       setViewMode]       = useState<'table' | 'calendar'>('table');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [toast,          setToast]          = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await Api.getBnbBookings({
        search: searchTerm,
        status: statusFilter,
        property_id: selectedPropertyId ? Number(selectedPropertyId) : undefined,
      });
      setBookings(response.data || []);
    } catch (error) {
      console.error('Failed to load bookings:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, selectedPropertyId]);

  useEffect(() => {
    const loadProperties = async () => {
      try {
        const res = await Api.getBnbProperties();
        const items = (res.data || []).map((p: any) => ({ id: p.id, title: p.title }));
        setProperties(items);
        if (items.length === 1) setSelectedPropertyId(items[0].id);
      } catch (e) {
        console.error('Failed to load BnB properties:', e);
      }
    };
    loadProperties();
  }, []);

  useEffect(() => { loadBookings(); }, [loadBookings]);

  const handleStatusUpdate = async (id: number, newStatus: string) => {
    try {
      await Api.updateBnbBookingStatus(id, newStatus);
      // Optimistic update
      setBookings((prev) =>
        prev.map((b) => b.id === id ? { ...b, status: newStatus as Booking['status'] } : b)
      );
      if (selectedBooking?.id === id) {
        setSelectedBooking((prev) => prev ? { ...prev, status: newStatus as Booking['status'] } : null);
      }
      showToast(`Booking marked as ${newStatus}`);
    } catch {
      showToast('Failed to update status', false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0 }).format(amount);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-TZ', { month: 'short', day: 'numeric', year: 'numeric' });

  // Stats
  const counts = bookings.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const th: React.CSSProperties = {
    textAlign:     'left',
    padding:       '12px 14px',
    fontSize:      11,
    fontWeight:    700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color:         t.muted,
    borderBottom:  `1px solid ${t.border}`,
    whiteSpace:    'nowrap',
  };

  const td: React.CSSProperties = {
    padding:      '14px',
    fontSize:     13.5,
    color:        t.ink,
    borderBottom: `1px solid ${t.border}`,
    verticalAlign: 'top',
  };

  return (
    <div style={{ padding: '28px 24px', maxWidth: 1400, margin: '0 auto', backgroundColor: t.bg, minHeight: '100vh', ...body }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0%{background-position:100% 0} 100%{background-position:-100% 0} }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .stat-pill { background: ${t.surface}; border: 1px solid ${t.border}; border-radius: 10px; padding: 12px 18px; text-align: center; min-width: 90px; }
        .filter-input { padding: 10px 14px; border: 1px solid ${t.border}; border-radius: 8px; background: ${t.surface2}; color: ${t.ink}; font-size: 14px; outline: none; transition: border-color 0.2s; font-family: Inter, sans-serif; }
        .filter-input:focus { border-color: ${t.gold}80; }
        .filter-input option { background: ${t.surface}; }
        .bk-row { transition: background 0.15s; animation: fadeIn 0.25s ease both; }
        .bk-row:hover { background: ${t.surface2}; }
        .bk-table { width: 100%; border-collapse: collapse; }
        .view-btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 13px; background: ${t.gold}; border: none; border-radius: 7px; color: ${t.onAccent}; font-size: 12.5px; font-weight: 600; cursor: pointer; transition: opacity 0.15s; white-space: nowrap; font-family: Inter, sans-serif; }
        .view-btn:hover { opacity: 0.88; }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position:    'fixed',
          top:         24,
          right:       24,
          padding:     '12px 20px',
          background:  t.surface,
          border:      `1px solid ${toast.ok ? t.green : t.red}40`,
          borderRadius: 10,
          color:       toast.ok ? t.green : t.red,
          fontSize:    14,
          fontWeight:  500,
          zIndex:      2000,
          animation:   'fadeIn 0.2s ease',
          boxShadow:   '0 8px 24px rgba(28,25,23,0.12)',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ ...serif, fontSize: 32, fontWeight: 600, margin: '0 0 6px', color: t.ink }}>
          BnB Bookings
        </h1>
        <p style={{ fontSize: 15, color: t.muted, margin: 0 }}>
          Manage all property booking requests
        </p>
      </div>

      {/* Stats */}
      {!loading && bookings.length > 0 && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <div className="stat-pill">
            <div style={{ ...serif, fontSize: 22, fontWeight: 700, color: t.ink }}>{bookings.length}</div>
            <div style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>Total</div>
          </div>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            counts[key] ? (
              <div key={key} className="stat-pill" style={{ borderColor: `${cfg.color}30` }}>
                <div style={{ ...serif, fontSize: 22, fontWeight: 700, color: cfg.color }}>{counts[key]}</div>
                <div style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>{cfg.label}</div>
              </div>
            ) : null
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ ...card, padding: '14px 16px', marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          className="filter-input"
          placeholder="Search by property or guest…"
          value={searchTerm}
          style={{ minWidth: 260, flex: 1 }}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="filter-input"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
        </select>
        <select
          className="filter-input"
          value={selectedPropertyId}
          onChange={(e) => setSelectedPropertyId(e.target.value ? Number(e.target.value) : '')}
          style={{ minWidth: 200 }}
        >
          <option value="">All properties</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>
        <div style={{ display: 'flex', gap: 4, background: t.surface2, borderRadius: 8, padding: 4, border: `1px solid ${t.border}` }}>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            style={{
              ...body, display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px',
              border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: viewMode === 'table' ? t.surface : 'transparent',
              color: viewMode === 'table' ? t.ink : t.muted,
            }}
          >
            <Table2 size={14} /> Table
          </button>
          <button
            type="button"
            onClick={() => setViewMode('calendar')}
            style={{
              ...body, display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px',
              border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: viewMode === 'calendar' ? t.surface : 'transparent',
              color: viewMode === 'calendar' ? t.ink : t.muted,
            }}
          >
            <CalendarDays size={14} /> Calendar
          </button>
        </div>
        <button
          onClick={loadBookings}
          style={{
            ...body,
            display:    'flex',
            alignItems: 'center',
            gap:        6,
            padding:    '10px 16px',
            background: `${t.blue}18`,
            border:     'none',
            borderRadius: 8,
            color:      t.blue,
            fontSize:   14,
            fontWeight: 500,
            cursor:     'pointer',
            transition: 'all 0.2s',
          }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Owner calendar */}
      {viewMode === 'calendar' && (
        <div style={{ ...card, padding: 20, marginBottom: 24 }}>
          <h2 style={{ ...serif, fontSize: 20, fontWeight: 600, margin: '0 0 6px', color: t.ink }}>Live booking calendar</h2>
          <p style={{ fontSize: 14, color: t.muted, margin: '0 0 16px' }}>
            See confirmed and pending stays update in real time — the same view guests see when booking.
          </p>
          {selectedPropertyId ? (
            <BnbAvailabilityCalendar
              propertyId={Number(selectedPropertyId)}
              mode="owner"
              accent={t.gold}
              refreshIntervalMs={30000}
            />
          ) : (
            <div style={{ padding: 24, textAlign: 'center', color: t.muted, fontSize: 14, background: t.surface2, borderRadius: 10, border: `1px dashed ${t.border}` }}>
              Select a property above to open its availability calendar.
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {viewMode === 'table' && loading ? (
        <div style={{ ...card }}>
          {[0,1,2,3,4,5].map((i) => (
            <div key={i} style={{ height: 52, background: `linear-gradient(90deg, ${t.surface2} 25%, #FFFFFF 50%, ${t.surface2} 75%)`, backgroundSize: '400% 100%', animation: 'shimmer 1.4s ease infinite', borderBottom: `1px solid ${t.border}` }} />
          ))}
        </div>
      ) : viewMode === 'table' && bookings.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', padding: '80px 24px', animation: 'fadeIn 0.4s ease' }}>
          <Calendar size={40} style={{ color: t.muted, marginBottom: 16 }} />
          <div style={{ ...serif, fontSize: 20, fontWeight: 600, color: t.ink, marginBottom: 8 }}>No bookings found</div>
          <div style={{ fontSize: 14, color: t.muted }}>Bookings will appear here once guests submit requests.</div>
        </div>
      ) : viewMode === 'table' ? (
        <div style={{ ...card, overflowX: 'auto' }}>
          <table className="bk-table">
            <thead>
              <tr>
                <th style={th}>Property</th>
                <th style={th}>Guest</th>
                <th style={th}>Check-in</th>
                <th style={th}>Check-out</th>
                <th style={th}>Nights</th>
                <th style={th}>Guests</th>
                <th style={th}>Amount</th>
                <th style={th}>Status</th>
                <th style={{ ...th, textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking, idx) => {
                const guest  = getGuestInfo(booking);
                const nights = getNights(booking.check_in, booking.check_out);

                return (
                  <tr key={booking.id} className="bk-row" style={{ animationDelay: `${idx * 0.03}s` }}>
                    <td style={{ ...td, maxWidth: 220 }}>
                      <div style={{ ...serif, fontWeight: 600, color: t.gold, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {booking.property?.title || `Property #${booking.property_id}`}
                      </div>
                      {booking.special_requests && booking.special_requests.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 11, color: t.muted }}>
                          <MessageSquare size={10} /> Has requests
                        </div>
                      )}
                    </td>
                    <td style={{ ...td, maxWidth: 200 }}>
                      <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{guest.name}</div>
                      {(guest.email || guest.phone) && (
                        <div style={{ fontSize: 11.5, color: t.muted, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {guest.email || guest.phone}
                        </div>
                      )}
                    </td>
                    <td style={td}>{formatDate(booking.check_in)}</td>
                    <td style={td}>{formatDate(booking.check_out)}</td>
                    <td style={td}>{nights}</td>
                    <td style={td}>{booking.guests}</td>
                    <td style={{ ...td, ...serif, fontWeight: 700, color: t.green, whiteSpace: 'nowrap' }}>
                      {formatCurrency(booking.total_price)}
                    </td>
                    <td style={td}><StatusBadge status={booking.status} /></td>
                    <td style={{ ...td, textAlign: 'right' }}>
                      <button
                        className="view-btn"
                        onClick={() => setSelectedBooking(booking)}
                      >
                        <Eye size={13} /> View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* Detail Modal — clicking "View" opens the full card-style breakdown */}
      {selectedBooking && (
        <DetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onUpdate={handleStatusUpdate}
        />
      )}
    </div>
  );
};

export default BnbBookings;