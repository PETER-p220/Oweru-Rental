import { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Camera, Play, Video } from 'lucide-react';
import {
  buildPropertyMediaGallery,
  PROPERTY_IMAGE_PLACEHOLDER,
  type PropertyMediaItem,
} from '../utils/propertyImages';

type Props = {
  property: Record<string, unknown> | null | undefined;
  title?: string;
  height?: number;
  className?: string;
};

const PropertyMediaGallery = ({ property, title = 'Property', height = 420, className = '' }: Props) => {
  const [selected, setSelected] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const media = useMemo(() => {
    const items = buildPropertyMediaGallery(property);
    return items.length > 0 ? items : [{ type: 'image' as const, url: PROPERTY_IMAGE_PLACEHOLDER }];
  }, [property]);

  useEffect(() => {
    setSelected(0);
  }, [property]);

  useEffect(() => {
    const item = media[selected];
    if (item?.type !== 'video' && videoRef.current) {
      videoRef.current.pause();
    }
  }, [selected, media]);

  const current = media[selected] ?? media[0];
  const hasMultiple = media.length > 1;

  const prev = () => setSelected((i) => (i - 1 + media.length) % media.length);
  const next = () => setSelected((i) => (i + 1) % media.length);

  return (
    <div className={className} style={{ background: '#E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ position: 'relative', height, overflow: 'hidden', background: '#E2E8F0' }}>
        {current.type === 'video' ? (
          <video
            ref={videoRef}
            key={current.url}
            src={current.url}
            controls
            playsInline
            preload="metadata"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', background: '#0F172A' }}
          />
        ) : (
          <img
            src={current.url}
            alt={title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            loading="eager"
            decoding="async"
          />
        )}

        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,23,42,.55) 0%, transparent 45%)', pointerEvents: 'none' }} />

        {current.type === 'video' && (
          <div style={{
            position: 'absolute', top: 14, left: 14,
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: 'rgba(15,23,42,0.82)', color: '#fff',
            padding: '4px 10px', borderRadius: 999, fontSize: 10,
            fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
            backdropFilter: 'blur(6px)',
          }}>
            <Video size={11} /> Video Tour
          </div>
        )}

        {hasMultiple && (
          <>
            <button type="button" className="pd-nav-btn" onClick={prev} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', border: 'none' }}>
              <ChevronLeft size={18} />
            </button>
            <button type="button" className="pd-nav-btn" onClick={next} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', border: 'none' }}>
              <ChevronRight size={18} />
            </button>
          </>
        )}

        <div style={{
          position: 'absolute', bottom: 14, right: 14,
          display: 'inline-flex', alignItems: 'center', gap: 5,
          fontSize: 11, color: '#fff', background: 'rgba(15,23,42,0.72)',
          padding: '4px 10px', borderRadius: 20, backdropFilter: 'blur(6px)',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {current.type === 'video' ? <Play size={10} /> : <Camera size={10} />}
          {selected + 1} / {media.length}
        </div>
      </div>

      {hasMultiple && (
        <div style={{ display: 'flex', gap: 8, padding: '12px 14px', overflowX: 'auto', background: '#fff' }}>
          {media.map((item: PropertyMediaItem, i: number) => (
            <button
              key={`${item.type}-${item.url}-${i}`}
              type="button"
              className={`pd-thumb${selected === i ? ' active' : ''}`}
              onClick={() => setSelected(i)}
              style={{
                width: 68, height: 48, flexShrink: 0, borderRadius: 6,
                overflow: 'hidden', background: '#E2E8F0', border: 'none', padding: 0,
                position: 'relative', cursor: 'pointer',
              }}
            >
              {item.type === 'video' ? (
                <>
                  <div style={{ width: '100%', height: '100%', background: '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Play size={16} style={{ color: '#C89128' }} />
                  </div>
                </>
              ) : (
                <img
                  src={item.url}
                  alt={`View ${i + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  loading="lazy"
                  decoding="async"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PropertyMediaGallery;
