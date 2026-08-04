import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw, X } from 'lucide-react';
import Api from '../../services/api';

export interface BnbAvailabilityCalendarProps {
  propertyId: number;
  mode?: 'guest' | 'owner';
  checkIn?: string;
  checkOut?: string;
  onRangeChange?: (checkIn: string, checkOut: string) => void;
  refreshIntervalMs?: number;
  accent?: string;
  /** Show check-in / check-out fields above the grid (booking mode). */
  showDateFields?: boolean;
}

type DayStatus = 'available' | 'booked' | 'pending' | 'past' | 'selected' | 'in-range' | 'preview';

interface AvailabilityData {
  blocked_dates: string[];
  date_status?: Record<string, string>;
  bookings?: Array<{
    id: number;
    check_in: string;
    check_out: string;
    status: string;
    guest_name?: string;
  }>;
  synced_at?: string;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function daysBetween(a: string, b: string): number {
  return Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / 86400000);
}

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return 'Select date';
  return parseDate(dateStr).toLocaleDateString('en-TZ', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

const BnbAvailabilityCalendar = ({
  propertyId,
  mode = 'guest',
  checkIn = '',
  checkOut = '',
  onRangeChange,
  refreshIntervalMs = 45000,
  accent = '#C89128',
  showDateFields,
}: BnbAvailabilityCalendarProps) => {
  const interactive = !!onRangeChange;
  const showFields = showDateFields ?? interactive;

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const todayStr = useMemo(() => toDateStr(today), [today]);

  const [viewMonth, setViewMonth] = useState(() => {
    const base = checkIn ? parseDate(checkIn) : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const [availability, setAvailability] = useState<AvailabilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [picking, setPicking] = useState<'check_in' | 'check_out'>('check_in');
  const [localCheckIn, setLocalCheckIn] = useState(checkIn);
  const [localCheckOut, setLocalCheckOut] = useState(checkOut);
  const [hoverDate, setHoverDate] = useState('');
  const [lastSync, setLastSync] = useState<string>('');
  const [rangeError, setRangeError] = useState('');

  useEffect(() => {
    setLocalCheckIn(checkIn);
    setLocalCheckOut(checkOut);
    if (checkIn && !checkOut) setPicking('check_out');
    else if (checkIn && checkOut) setPicking('check_in');
  }, [checkIn, checkOut]);

  const monthKey = `${viewMonth.getFullYear()}-${String(viewMonth.getMonth() + 1).padStart(2, '0')}`;

  const loadAvailability = useCallback(async (silent = false) => {
    if (!propertyId) return;
    try {
      if (!silent) setLoading(true);
      const res = mode === 'owner'
        ? await Api.getBnbOwnerPropertyAvailability(propertyId, { month: monthKey })
        : await Api.getBnbPropertyAvailability(propertyId, { month: monthKey });
      const data = res.data || res;
      setAvailability(data);
      setLastSync(data.synced_at || new Date().toISOString());
    } catch (e) {
      console.error('Failed to load availability:', e);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [propertyId, mode, monthKey]);

  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  useEffect(() => {
    if (!refreshIntervalMs || refreshIntervalMs <= 0) return undefined;
    const id = window.setInterval(() => loadAvailability(true), refreshIntervalMs);
    return () => window.clearInterval(id);
  }, [loadAvailability, refreshIntervalMs]);

  const blockedSet = useMemo(() => new Set(availability?.blocked_dates ?? []), [availability]);
  const statusMap = availability?.date_status ?? {};

  const previewEnd = useMemo(() => {
    if (!interactive || picking !== 'check_out' || !localCheckIn || !hoverDate) return '';
    if (hoverDate <= localCheckIn) return '';
    return hoverDate;
  }, [interactive, picking, localCheckIn, hoverDate]);

  const getDayStatus = (dateStr: string): DayStatus => {
    const d = parseDate(dateStr);
    if (d < today) return 'past';

    if (localCheckIn && localCheckOut) {
      if (dateStr === localCheckIn || dateStr === localCheckOut) return 'selected';
      if (dateStr > localCheckIn && dateStr < localCheckOut) return 'in-range';
    } else if (localCheckIn && dateStr === localCheckIn) {
      return 'selected';
    }

    if (previewEnd && localCheckIn) {
      if (dateStr === previewEnd) return 'preview';
      if (dateStr > localCheckIn && dateStr < previewEnd) return 'in-range';
    }

    if (blockedSet.has(dateStr)) {
      return statusMap[dateStr] === 'pending' ? 'pending' : 'booked';
    }
    return 'available';
  };

  const isDateBlockedForSelection = (dateStr: string): boolean => {
    if (parseDate(dateStr) < today) return true;
    if (blockedSet.has(dateStr)) return true;
    return false;
  };

  const rangeHasBlocked = (start: string, end: string): boolean => {
    let cursor = parseDate(start);
    const endDate = parseDate(end);
    while (cursor < endDate) {
      const key = toDateStr(cursor);
      if (blockedSet.has(key)) return true;
      cursor = addDays(cursor, 1);
    }
    return false;
  };

  const clearDates = () => {
    setLocalCheckIn('');
    setLocalCheckOut('');
    setPicking('check_in');
    setHoverDate('');
    setRangeError('');
    onRangeChange?.('', '');
  };

  const handleDayClick = (dateStr: string) => {
    if (!onRangeChange || isDateBlockedForSelection(dateStr)) return;
    setRangeError('');

    if (localCheckIn && localCheckOut && dateStr !== localCheckIn && dateStr !== localCheckOut) {
      setLocalCheckIn(dateStr);
      setLocalCheckOut('');
      setPicking('check_out');
      onRangeChange(dateStr, '');
      return;
    }

    if (picking === 'check_in' || !localCheckIn || dateStr <= localCheckIn) {
      setLocalCheckIn(dateStr);
      setLocalCheckOut('');
      setPicking('check_out');
      onRangeChange(dateStr, '');
      const month = parseDate(dateStr);
      setViewMonth(new Date(month.getFullYear(), month.getMonth(), 1));
      return;
    }

    const nights = daysBetween(localCheckIn, dateStr);
    if (nights < 1) {
      setRangeError('Check-out must be after check-in.');
      return;
    }
    if (rangeHasBlocked(localCheckIn, dateStr)) {
      setRangeError('Some nights in this range are already booked. Pick different dates.');
      return;
    }

    setLocalCheckOut(dateStr);
    setPicking('check_in');
    setHoverDate('');
    onRangeChange(localCheckIn, dateStr);
  };

  const handleDateFieldClick = (field: 'check_in' | 'check_out') => {
    if (!interactive) return;
    if (field === 'check_out' && !localCheckIn) {
      setPicking('check_in');
      return;
    }
    setPicking(field);
    setRangeError('');
    if (field === 'check_in' && localCheckIn) {
      const month = parseDate(localCheckIn);
      setViewMonth(new Date(month.getFullYear(), month.getMonth(), 1));
    } else if (field === 'check_out' && localCheckOut) {
      const month = parseDate(localCheckOut);
      setViewMonth(new Date(month.getFullYear(), month.getMonth(), 1));
    }
  };

  const calendarDays = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstDow = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: Array<{ dateStr: string | null; day: number | null }> = [];

    for (let i = 0; i < firstDow; i++) cells.push({ dateStr: null, day: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ dateStr, day: d });
    }
    return cells;
  }, [viewMonth]);

  const monthLabel = viewMonth.toLocaleDateString('en-TZ', { month: 'long', year: 'numeric' });
  const nights = localCheckIn && localCheckOut ? daysBetween(localCheckIn, localCheckOut) : 0;

  const statusColors: Record<DayStatus, { bg: string; color: string; border: string }> = {
    available: { bg: '#fff', color: '#0F172A', border: '#E2E8F0' },
    booked: { bg: '#FEE2E2', color: '#991B1B', border: '#FECACA' },
    pending: { bg: '#FEF3C7', color: '#92400E', border: '#FDE68A' },
    past: { bg: '#F8FAFC', color: '#CBD5E1', border: '#F1F5F9' },
    selected: { bg: accent, color: '#0F172A', border: accent },
    'in-range': { bg: `${accent}33`, color: '#0F172A', border: `${accent}55` },
    preview: { bg: `${accent}66`, color: '#0F172A', border: accent },
  };

  const pickingHint = !localCheckIn
    ? 'Tap your check-in date on the calendar'
    : !localCheckOut
      ? 'Now tap your check-out date'
      : `${nights} night${nights === 1 ? '' : 's'} selected — tap a date to change`;

  return (
    <div style={{ fontFamily: 'DM Sans, Inter, sans-serif' }}>
      {showFields && interactive && (
        <div style={{ marginBottom: 14 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              border: `1.5px solid ${accent}`,
              borderRadius: 12,
              overflow: 'hidden',
              background: '#fff',
            }}
          >
            <button
              type="button"
              onClick={() => handleDateFieldClick('check_in')}
              style={{
                padding: '12px 14px',
                border: 'none',
                borderRight: '1px solid #E2E8F0',
                background: picking === 'check_in' ? `${accent}14` : '#fff',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'inherit',
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                Check-in
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: localCheckIn ? '#0F172A' : '#94A3B8' }}>
                {formatDisplayDate(localCheckIn)}
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleDateFieldClick('check_out')}
              style={{
                padding: '12px 14px',
                border: 'none',
                background: picking === 'check_out' ? `${accent}14` : '#fff',
                cursor: localCheckIn ? 'pointer' : 'not-allowed',
                textAlign: 'left',
                opacity: localCheckIn ? 1 : 0.65,
                fontFamily: 'inherit',
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                Check-out
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: localCheckOut ? '#0F172A' : '#94A3B8' }}>
                {formatDisplayDate(localCheckOut)}
              </div>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 10 }}>
            <p style={{ margin: 0, fontSize: 12, color: picking === 'check_out' && localCheckIn ? accent : '#64748B', fontWeight: 600, lineHeight: 1.4 }}>
              {pickingHint}
            </p>
            {(localCheckIn || localCheckOut) && (
              <button
                type="button"
                onClick={clearDates}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  background: 'none', border: 'none', color: '#64748B',
                  fontSize: 11, fontWeight: 600, cursor: 'pointer', padding: '4px 0',
                  fontFamily: 'inherit', flexShrink: 0,
                }}
              >
                <X size={12} /> Clear
              </button>
            )}
          </div>

          {rangeError && (
            <p style={{ margin: '8px 0 0', fontSize: 12, color: '#DC2626', fontWeight: 600 }}>{rangeError}</p>
          )}

          {nights > 0 && (
            <div style={{
              marginTop: 10, padding: '8px 12px', background: `${accent}12`,
              borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#0F172A',
            }}>
              {nights} night{nights === 1 ? '' : 's'} · {formatDisplayDate(localCheckIn)} → {formatDisplayDate(localCheckOut)}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <button
          type="button"
          onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
          style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: 8, padding: 6, cursor: 'pointer', display: 'flex' }}
          aria-label="Previous month"
        >
          <ChevronLeft size={16} />
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>{monthLabel}</div>
          {lastSync && (
            <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>
              Live · updated {new Date(lastSync).toLocaleTimeString('en-TZ', { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            type="button"
            onClick={() => loadAvailability()}
            style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: 8, padding: 6, cursor: 'pointer', display: 'flex' }}
            aria-label="Refresh calendar"
          >
            <RefreshCw size={14} className={loading ? 'bnb-cal-spin' : undefined} />
          </button>
          <button
            type="button"
            onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
            style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: 8, padding: 6, cursor: 'pointer', display: 'flex' }}
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {!interactive && (
        <p style={{ margin: '0 0 10px', fontSize: 12, color: '#64748B' }}>
          Red dates are booked. Select your stay dates in the booking panel →
        </p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
        {WEEKDAYS.map((wd) => (
          <div key={wd} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#64748B', padding: '4px 0' }}>
            {wd}
          </div>
        ))}
      </div>

      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, opacity: loading ? 0.65 : 1, transition: 'opacity 0.2s' }}
        onMouseLeave={() => setHoverDate('')}
      >
        {calendarDays.map((cell, idx) => {
          if (!cell.dateStr || cell.day === null) {
            return <div key={`empty-${idx}`} style={{ aspectRatio: '1', minHeight: 36 }} />;
          }
          const status = getDayStatus(cell.dateStr);
          const colors = statusColors[status];
          const blocked = status === 'booked' || status === 'pending';
          const clickable = interactive && status !== 'past' && !blocked;
          const isToday = cell.dateStr === todayStr;

          return (
            <button
              key={cell.dateStr}
              type="button"
              disabled={!clickable}
              onClick={() => handleDayClick(cell.dateStr!)}
              onMouseEnter={() => {
                if (interactive && picking === 'check_out' && localCheckIn && !blocked && parseDate(cell.dateStr!) >= today) {
                  setHoverDate(cell.dateStr!);
                }
              }}
              title={blockedSet.has(cell.dateStr) ? (statusMap[cell.dateStr] === 'pending' ? 'Pending booking' : 'Booked') : undefined}
              style={{
                aspectRatio: '1',
                minHeight: 36,
                border: isToday && status === 'available' ? `2px solid ${accent}` : `1px solid ${colors.border}`,
                borderRadius: 8,
                background: colors.bg,
                color: colors.color,
                fontSize: 12,
                fontWeight: status === 'selected' || status === 'preview' ? 800 : 500,
                cursor: clickable ? 'pointer' : 'default',
                padding: 0,
                opacity: status === 'past' ? 0.7 : 1,
                position: 'relative',
              }}
            >
              {cell.day}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12, fontSize: 11, color: '#64748B' }}>
        {[
          { label: 'Available', status: 'available' as DayStatus },
          { label: 'Booked', status: 'booked' as DayStatus },
          { label: 'Pending', status: 'pending' as DayStatus },
          { label: 'Your stay', status: 'selected' as DayStatus },
        ].map(({ label, status }) => (
          <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{
              width: 12, height: 12, borderRadius: 3,
              background: statusColors[status].bg,
              border: `1px solid ${statusColors[status].border}`,
            }} />
            {label}
          </span>
        ))}
      </div>

      {mode === 'owner' && availability?.bookings && availability.bookings.length > 0 && (
        <div style={{ marginTop: 14, padding: 12, background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Bookings this month
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {availability.bookings.map((b) => (
              <div key={b.id} style={{ fontSize: 12, color: '#334155', display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span>
                  {new Date(b.check_in).toLocaleDateString('en-TZ', { month: 'short', day: 'numeric' })}
                  {' → '}
                  {new Date(b.check_out).toLocaleDateString('en-TZ', { month: 'short', day: 'numeric' })}
                  {b.guest_name ? ` · ${b.guest_name}` : ''}
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                  color: b.status === 'confirmed' ? '#16A34A' : '#D97706',
                }}>
                  {b.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes bnb-cal-spin { to { transform: rotate(360deg); } }
        .bnb-cal-spin { animation: bnb-cal-spin 1s linear infinite; }
      `}</style>
    </div>
  );
};

export default BnbAvailabilityCalendar;
