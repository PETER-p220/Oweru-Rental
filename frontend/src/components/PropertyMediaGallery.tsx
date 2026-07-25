import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
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
  const [videoPlaying, setVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const media = useMemo(() => {
    const items = buildPropertyMediaGallery(property);
    return items.length > 0 ? items : [{ type: 'image' as const, url: PROPERTY_IMAGE_PLACEHOLDER }];
  }, [property]);

  const current = media[selected] ?? media[0];
  const isVideo = current?.type === 'video';
  const hasMultiple = media.length > 1;

  const resetVideo = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
    el.playbackRate = 1;
    setVideoPlaying(false);
  }, []);

  useEffect(() => {
    setSelected(0);
    setVideoPlaying(false);
  }, [property]);

  useEffect(() => {
    resetVideo();
  }, [selected, resetVideo]);

  const playVideo = async () => {
    const el = videoRef.current;
    if (!el) return;
    try {
      el.playbackRate = 1;
      await el.play();
      setVideoPlaying(true);
    } catch {
      /* ignore autoplay policy errors */
    }
  };

  const prev = () => setSelected((i) => (i - 1 + media.length) % media.length);
  const next = () => setSelected((i) => (i + 1) % media.length);

  const selectItem = (index: number) => {
    setSelected(index);
    if (media[index]?.type === 'video') setVideoPlaying(false);
  };

  return (
    <div className={className} style={{ background: '#FFFFFF', borderRadius: 12, overflow: 'hidden' }}>
      {isVideo ? (
        /* Video — capped to the gallery height so tall/portrait clips don't blow out the layout */
        <div
          style={{
            position: 'relative',
            width: '100%',
            height,
            overflow: 'hidden',
            background: '#0F172A',
          }}
        >
          <video
            ref={videoRef}
            key={current.url}
            src={current.url}
            playsInline
            preload="auto"
            controls={videoPlaying}
            onPlay={() => {
              if (videoRef.current) videoRef.current.playbackRate = 1;
              setVideoPlaying(true);
            }}
            onPause={() => setVideoPlaying(false)}
            onEnded={() => setVideoPlaying(false)}
            onLoadedMetadata={() => {
              if (videoRef.current) videoRef.current.playbackRate = 1;
            }}
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
              objectFit: 'cover',
              verticalAlign: 'top',
            }}
          />

          {!videoPlaying && (
            <button
              type="button"
              aria-label="Play property video"
              onClick={playVideo}
              style={{
                position: 'absolute',
                inset: 0,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2,
              }}
            >
              <span style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.92)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 24px rgba(15,23,42,0.18)',
              }}>
                <Play size={30} style={{ color: '#C89128', marginLeft: 4 }} fill="#C89128" />
              </span>
            </button>
          )}

          

          {hasMultiple && (
            <>
              <button type="button" className="pd-nav-btn" onClick={prev} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', border: 'none', zIndex: 4 }}>
                <ChevronLeft size={18} />
              </button>
              <button type="button" className="pd-nav-btn" onClick={next} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', border: 'none', zIndex: 4 }}>
                <ChevronRight size={18} />
              </button>
            </>
          )}

          {hasMultiple && (
            <div style={{
              position: 'absolute', bottom: 14, right: 14, zIndex: 4,
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 11, color: '#fff', background: 'rgba(15,23,42,0.72)',
              padding: '4px 10px', borderRadius: 20,
              fontFamily: "'DM Sans', sans-serif",
              pointerEvents: 'none',
            }}>
              <Play size={10} /> {selected + 1} / {media.length}
            </div>
          )}
        </div>
      ) : (
        /* Images — fixed hero height */
        <div style={{ position: 'relative', height, overflow: 'hidden', background: '#E2E8F0' }}>
          <img
            src={current.url}
            alt={title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            loading="eager"
            decoding="async"
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(15,23,42,.55) 0%, transparent 45%)',
            pointerEvents: 'none',
          }} />

          {hasMultiple && (
            <>
              <button type="button" className="pd-nav-btn" onClick={prev} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', border: 'none', zIndex: 4 }}>
                <ChevronLeft size={18} />
              </button>
              <button type="button" className="pd-nav-btn" onClick={next} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', border: 'none', zIndex: 4 }}>
                <ChevronRight size={18} />
              </button>
            </>
          )}

          {hasMultiple && (
            <div style={{
              position: 'absolute', bottom: 14, right: 14, zIndex: 4,
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 11, color: '#fff', background: 'rgba(15,23,42,0.72)',
              padding: '4px 10px', borderRadius: 20,
              fontFamily: "'DM Sans', sans-serif",
              pointerEvents: 'none',
            }}>
              <Camera size={10} /> {selected + 1} / {media.length}
            </div>
          )}
        </div>
      )}

      {hasMultiple && (
        <div style={{ display: 'flex', gap: 8, padding: '12px 14px', overflowX: 'auto', background: '#fff', borderTop: '1px solid #E2E8F0' }}>
          {media.map((item: PropertyMediaItem, i: number) => (
            <button
              key={`${item.type}-${item.url}-${i}`}
              type="button"
              className={`pd-thumb${selected === i ? ' active' : ''}`}
              onClick={() => selectItem(i)}
              style={{
                width: 68, height: 48, flexShrink: 0, borderRadius: 6,
                overflow: 'hidden', background: '#E2E8F0', border: 'none', padding: 0,
                position: 'relative', cursor: 'pointer',
              }}
            >
              {item.type === 'video' ? (
                <div style={{ width: '100%', height: '100%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Play size={16} style={{ color: '#C89128' }} />
                </div>
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