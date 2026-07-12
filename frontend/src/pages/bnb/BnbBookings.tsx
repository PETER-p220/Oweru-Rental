import { useState, useEffect, useCallback } from 'react';
import { Calendar, Users, MessageSquare, Phone, Mail, Home, X, CheckCircle, XCircle, Clock, RefreshCw, ChevronDown } from 'lucide-react';
import Api from '../../services/api';

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

// ─── Status config ───────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  icon: Clock       },
  confirmed: { label: 'Confirmed', color: '#10b981', bg: 'rgba(16,185,129,0.12)',  icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   icon: XCircle     },
  completed: { label: 'Completed', color: '#C89128', bg: 'rgba(200,145,40,0.12)',  icon: CheckCircle },
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
    label: status, color: '#6b7280', bg: 'rgba(107,114,128,0.12)', icon: Clock,
  };
  const Icon = cfg.icon;
  return (
    <span style={{
      display:        'inline-flex',
      alignItems:     'center',
      gap:            5,
      padding:        '4px 10px',
      borderRadius:   20,
      fontSize:       11,
      fontWeight:     600,
      letterSpacing:  '0.04em',
      textTransform:  'uppercase',
      background:     cfg.bg,
      color:          cfg.color,
      border:         `1px solid ${cfg.color}30`,
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
          display:      'flex',
          alignItems:   'center',
          gap:          6,
          padding:      '6px 12px',
          background:   loading ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)',
          border:       '1px solid rgba(255,255,255,0.12)',
          borderRadius: 6,
          color:        '#e8e4dc',
          fontSize:     12,
          fontWeight:   600,
          cursor:       loading ? 'wait' : 'pointer',
          transition:   'all 0.15s',
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
            background:  '#1a1a1a',
            border:      '1px solid rgba(255,255,255,0.12)',
            borderRadius: 8,
            overflow:    'hidden',
            zIndex:      200,
            minWidth:    130,
            boxShadow:   '0 8px 24px rgba(0,0,0,0.5)',
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
                onMouseEnter={(e) => (e.currentTarget.style.background = cfg.bg)}
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

// ─── Detail Modal ────────────────────────────────────────────────────────────
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
      borderBottom:  '1px solid rgba(255,255,255,0.05)',
      alignItems:    'start',
    }}>
      <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
        {icon}{label}
      </span>
      <span style={{ fontSize: 14, color: '#e8e4dc' }}>{value}</span>
    </div>
  );

  return (
    <div
      style={{
        position:       'fixed',
        inset:          0,
        background:     'rgba(0,0,0,0.85)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        zIndex:         1000,
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background:   '#141414',
          border:       '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16,
          padding:      28,
          maxWidth:     520,
          width:        '90%',
          maxHeight:    '85vh',
          overflow:     'auto',
          position:     'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#C89128', marginBottom: 4 }}>
              Booking #{booking.id}
            </div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#e8e4dc' }}>
              {booking.property?.title || `Property #${booking.property_id}`}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Status row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
          <StatusBadge status={booking.status} />
          <StatusUpdater booking={booking} onUpdate={onUpdate} />
        </div>

        {/* Details */}
        <div>
          {row('Property',   booking.property?.title || `#${booking.property_id}`, <Home size={12} />)}
          {row('Guest',      guest.name,  <Users size={12} />)}
          {guest.email && row('Email',    <a href={`mailto:${guest.email}`} style={{ color: '#C89128', textDecoration: 'none' }}>{guest.email}</a>, <Mail size={12} />)}
          {guest.phone && row('Phone',    <a href={`tel:${guest.phone}`}   style={{ color: '#C89128', textDecoration: 'none' }}>{guest.phone}</a>, <Phone size={12} />)}
          {row('Check-in',   new Date(booking.check_in).toLocaleDateString('en-TZ', { year: 'numeric', month: 'long', day: 'numeric' }), <Calendar size={12} />)}
          {row('Check-out',  new Date(booking.check_out).toLocaleDateString('en-TZ', { year: 'numeric', month: 'long', day: 'numeric' }), <Calendar size={12} />)}
          {row('Duration',   `${nights} night${nights !== 1 ? 's' : ''}`)}
          {row('Guests',     `${booking.guests} guest${booking.guests !== 1 ? 's' : ''}`, <Users size={12} />)}
          {row('Amount',
            <span style={{ color: '#10b981', fontWeight: 700, fontSize: 16 }}>
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
  const [loading,        setLoading]        = useState(true);
  const [searchTerm,     setSearchTerm]     = useState('');
  const [statusFilter,   setStatusFilter]   = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [toast,          setToast]          = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await Api.getBnbBookings({ search: searchTerm, status: statusFilter });
      setBookings(response.data || []);
    } catch (error) {
      console.error('Failed to load bookings:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter]);

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

  return (
    <div style={{
      fontFamily:  "'DM Sans', 'Helvetica Neue', sans-serif",
      background:  '#080808',
      color:       '#e8e4dc',
      minHeight:   '100vh',
      padding:     '28px 24px',
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .bk-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 20px; cursor: pointer; transition: all 0.2s; animation: fadeIn 0.3s ease both; }
        .bk-card:hover { background: rgba(255,255,255,0.07); border-color: rgba(201,168,76,0.3); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
        .stat-pill { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 12px 18px; text-align: center; min-width: 90px; }
        .filter-input { padding: 10px 14px; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; background: rgba(255,255,255,0.05); color: #e8e4dc; font-size: 14px; outline: none; transition: border-color 0.2s; font-family: inherit; }
        .filter-input:focus { border-color: rgba(201,168,76,0.5); }
        .filter-input option { background: #1a1a1a; }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position:    'fixed',
          top:         24,
          right:       24,
          padding:     '12px 20px',
          background:  toast.ok ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
          border:      `1px solid ${toast.ok ? '#10b981' : '#ef4444'}40`,
          borderRadius: 10,
          color:       toast.ok ? '#10b981' : '#ef4444',
          fontSize:    14,
          fontWeight:  500,
          zIndex:      2000,
          animation:   'fadeIn 0.2s ease',
          backdropFilter: 'blur(8px)',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 4px', color: '#e8e4dc', letterSpacing: '-0.02em' }}>
          BnB Bookings
        </h1>
        <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
          Manage all property booking requests
        </p>
      </div>

      {/* Stats */}
      {!loading && bookings.length > 0 && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <div className="stat-pill">
            <div style={{ fontSize: 22, fontWeight: 700, color: '#e8e4dc' }}>{bookings.length}</div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>Total</div>
          </div>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            counts[key] ? (
              <div key={key} className="stat-pill" style={{ borderColor: `${cfg.color}30` }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: cfg.color }}>{counts[key]}</div>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{cfg.label}</div>
              </div>
            ) : null
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <input
          type="text"
          className="filter-input"
          placeholder="Search by property or guest…"
          value={searchTerm}
          style={{ minWidth: 260 }}
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
        <button
          onClick={loadBookings}
          style={{
            display:    'flex',
            alignItems: 'center',
            gap:        6,
            padding:    '10px 16px',
            background: 'rgba(255,255,255,0.05)',
            border:     '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            color:      '#9ca3af',
            fontSize:   14,
            cursor:     'pointer',
            transition: 'all 0.2s',
            fontFamily: 'inherit',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#e8e4dc')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))' }}>
          {[0,1,2,3,4,5].map((i) => (
            <div key={i} style={{ height: 180, borderRadius: 14, background: 'rgba(255,255,255,0.03)', animation: 'fadeIn 0.3s ease both', animationDelay: `${i * 0.05}s` }} />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 24px', color: '#6b7280' }}>
          <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>📋</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#9ca3af', marginBottom: 6 }}>No bookings found</div>
          <div style={{ fontSize: 14 }}>Bookings will appear here once guests submit requests.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))' }}>
          {bookings.map((booking, idx) => {
            const guest  = getGuestInfo(booking);
            const nights = getNights(booking.check_in, booking.check_out);

            return (
              <div
                key={booking.id}
                className="bk-card"
                style={{ animationDelay: `${idx * 0.04}s` }}
                onClick={() => setSelectedBooking(booking)}
              >
                {/* Card Top */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#C89128', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {booking.property?.title || `Property #${booking.property_id}`}
                    </div>
                    <div style={{ fontSize: 13, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Users size={12} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{guest.name}</span>
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <StatusUpdater booking={booking} onUpdate={handleStatusUpdate} />
                  </div>
                </div>

                {/* Contact chips */}
                {(guest.email || guest.phone) && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                    {guest.email && (
                      <a
                        href={`mailto:${guest.email}`}
                        onClick={(e) => e.stopPropagation()}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6b7280', textDecoration: 'none', background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: 6 }}
                      >
                        <Mail size={10} />{guest.email}
                      </a>
                    )}
                    {guest.phone && (
                      <a
                        href={`tel:${guest.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6b7280', textDecoration: 'none', background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: 6 }}
                      >
                        <Phone size={10} />{guest.phone}
                      </a>
                    )}
                  </div>
                )}

                {/* Dates */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                  {[
                    { label: 'Check-in',  value: formatDate(booking.check_in)  },
                    { label: 'Check-out', value: formatDate(booking.check_out) },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 10px' }}>
                      <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
                      <div style={{ fontSize: 13, color: '#e8e4dc', fontWeight: 500 }}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#10b981' }}>
                      {formatCurrency(booking.total_price)}
                    </div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>{nights} night{nights !== 1 ? 's' : ''} · {booking.guests} guest{booking.guests !== 1 ? 's' : ''}</div>
                  </div>
                  <StatusBadge status={booking.status} />
                </div>

                {/* Special requests */}
                {booking.special_requests && booking.special_requests.length > 0 && (
                  <div style={{ marginTop: 10, padding: '7px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 7, fontSize: 12, color: '#6b7280', display: 'flex', gap: 6 }}>
                    <MessageSquare size={12} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>{booking.special_requests.join(', ')}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
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