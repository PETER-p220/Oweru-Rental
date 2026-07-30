import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface GuestBooking {
  id: number;
  check_in: string;
  check_out: string;
  status: string;
  property?: { title?: string; location?: string };
  property_id?: number;
}

interface GuestBookingsCalendarProps {
  bookings: GuestBooking[];
  accent?: string;
  onSelectBooking?: (booking: GuestBooking) => void;
  selectedBookingId?: number | null;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const STATUS_STYLE: Record<string, { bg: string; color: string; border: string; label: string }> = {
  confirmed: { bg: '#DCFCE7', color: '#166534', border: '#BBF7D0', label: 'Confirmed' },
  pending: { bg: '#FEF3C7', color: '#92400E', border: '#FDE68A', label: 'Pending' },
  completed: { bg: '#E0E7FF', color: '#3730A3', border: '#C7D2FE', label: 'Completed' },
  cancelled: { bg: '#F1F5F9', color: '#64748B', border: '#E2E8F0', label: 'Cancelled' },
};

const GuestBookingsCalendar = ({
  bookings,
  accent = '#C89128',
  onSelectBooking,
  selectedBookingId,
}: GuestBookingsCalendarProps) => {
  const upcoming = bookings.find((b) => ['pending', 'confirmed'].includes(b.status));
  const [viewMonth, setViewMonth] = useState(() => {
    const base = upcoming?.check_in ? parseDate(upcoming.check_in) : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const dayMap = useMemo(() => {
    const map: Record<string, GuestBooking[]> = {};
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);

    bookings.forEach((booking) => {
      let cursor = parseDate(booking.check_in);
      const checkout = parseDate(booking.check_out);
      while (cursor < checkout) {
        if (cursor >= monthStart && cursor <= monthEnd) {
          const key = toDateStr(cursor);
          if (!map[key]) map[key] = [];
          map[key].push(booking);
        }
        cursor.setDate(cursor.getDate() + 1);
      }
    });
    return map;
  }, [bookings, viewMonth]);

  const calendarDays = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstDow = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: Array<{ dateStr: string | null; day: number | null }> = [];
    for (let i = 0; i < firstDow; i++) cells.push({ dateStr: null, day: null });
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        day: d,
      });
    }
    return cells;
  }, [viewMonth]);

  const monthLabel = viewMonth.toLocaleDateString('en-TZ', { month: 'long', year: 'numeric' });

  const monthBookings = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const monthStart = toDateStr(new Date(year, month, 1));
    const monthEnd = toDateStr(new Date(year, month + 1, 0));
    return bookings.filter((b) => b.check_in <= monthEnd && b.check_out > monthStart);
  }, [bookings, viewMonth]);

  return (
    <div style={{ fontFamily: 'DM Sans, Inter, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <button
          type="button"
          onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
          style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: 8, padding: 6, cursor: 'pointer', display: 'flex' }}
        >
          <ChevronLeft size={16} />
        </button>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>{monthLabel}</div>
        <button
          type="button"
          onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
          style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: 8, padding: 6, cursor: 'pointer', display: 'flex' }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
        {WEEKDAYS.map((wd) => (
          <div key={wd} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#64748B', padding: '4px 0' }}>
            {wd}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {calendarDays.map((cell, idx) => {
          if (!cell.dateStr || cell.day === null) {
            return <div key={`e-${idx}`} style={{ aspectRatio: '1', minHeight: 36 }} />;
          }
          const dayBookings = dayMap[cell.dateStr] ?? [];
          const primary = dayBookings[0];
          const style = primary ? (STATUS_STYLE[primary.status] ?? STATUS_STYLE.pending) : null;
          const isSelected = primary && selectedBookingId === primary.id;

          return (
            <button
              key={cell.dateStr}
              type="button"
              disabled={!primary}
              onClick={() => primary && onSelectBooking?.(primary)}
              title={primary ? `${primary.property?.title || 'Stay'} (${primary.status})` : undefined}
              style={{
                aspectRatio: '1',
                minHeight: 36,
                border: `1px solid ${isSelected ? accent : style?.border ?? '#E2E8F0'}`,
                borderRadius: 8,
                background: isSelected ? `${accent}22` : style?.bg ?? '#fff',
                color: style?.color ?? '#0F172A',
                fontSize: 12,
                fontWeight: primary ? 700 : 500,
                cursor: primary ? 'pointer' : 'default',
                padding: 0,
                position: 'relative',
              }}
            >
              {cell.day}
              {dayBookings.length > 1 && (
                <span style={{
                  position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)',
                  width: 4, height: 4, borderRadius: '50%', background: accent,
                }} />
              )}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12, fontSize: 11, color: '#64748B' }}>
        {Object.entries(STATUS_STYLE).map(([key, cfg]) => (
          <span key={key} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: cfg.bg, border: `1px solid ${cfg.border}` }} />
            {cfg.label}
          </span>
        ))}
      </div>

      {monthBookings.length > 0 && (
        <div style={{ marginTop: 14, padding: 12, background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Stays in {monthLabel}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {monthBookings.map((b) => {
              const cfg = STATUS_STYLE[b.status] ?? STATUS_STYLE.pending;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => onSelectBooking?.(b)}
                  style={{
                    display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center',
                    background: selectedBookingId === b.id ? `${accent}18` : '#fff',
                    border: `1px solid ${selectedBookingId === b.id ? accent : '#E2E8F0'}`,
                    borderRadius: 8, padding: '8px 10px', cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 12, color: '#334155' }}>
                    <strong>{b.property?.title || 'Stay'}</strong>
                    {' · '}
                    {new Date(b.check_in).toLocaleDateString('en-TZ', { month: 'short', day: 'numeric' })}
                    {' → '}
                    {new Date(b.check_out).toLocaleDateString('en-TZ', { month: 'short', day: 'numeric' })}
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color, textTransform: 'uppercase' }}>{b.status}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestBookingsCalendar;
