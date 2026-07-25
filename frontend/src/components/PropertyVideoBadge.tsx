import { Play } from 'lucide-react';
import { propertyHasVideos } from '../utils/propertyImages';

type Props = {
  property: Record<string, unknown> | null | undefined;
  style?: React.CSSProperties;
};

const PropertyVideoBadge = ({ property, style }: Props) => {
  if (!propertyHasVideos(property)) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 12,
        left: 12,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        background: 'rgba(15,23,42,0.82)',
        color: '#fff',
        padding: '4px 10px',
        borderRadius: 999,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        backdropFilter: 'blur(6px)',
        pointerEvents: 'none',
        ...style,
      }}
    >
      <Play size={10} fill="currentColor" /> Video
    </div>
  );
};

export default PropertyVideoBadge;
