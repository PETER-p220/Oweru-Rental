import { memo, useState } from 'react';
import { getPropertyThumbnail, PROPERTY_IMAGE_PLACEHOLDER } from '../utils/propertyImages';
import PropertyVideoBadge from './PropertyVideoBadge';

type Props = {
  property: Record<string, unknown>;
  alt: string;
  className?: string;
  /** First row of cards — load immediately with higher priority. */
  priority?: boolean;
};

const PropertyThumbnail = memo(function PropertyThumbnail({
  property,
  alt,
  className = 'pc-img',
  priority = false,
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const src = failed ? PROPERTY_IMAGE_PLACEHOLDER : getPropertyThumbnail(property);

  return (
    <>
      {!loaded && <div className="pc-img-skeleton" aria-hidden />}
      <PropertyVideoBadge property={property} />
      <img
        src={src}
        alt={alt}
        className={`${className}${loaded ? ' is-loaded' : ''}`}
        width={400}
        height={300}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'low'}
        onLoad={() => setLoaded(true)}
        onError={() => {
          setFailed(true);
          setLoaded(true);
        }}
      />
    </>
  );
});

export default PropertyThumbnail;
