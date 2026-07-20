/** Must match Laravel: images.* => image|mimes:jpeg,png,jpg,gif */
export const PROPERTY_IMAGE_ACCEPT =
  'image/jpeg,image/png,image/gif,.jpg,.jpeg,.png,.gif';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/gif']);
const ALLOWED_EXT = /\.(jpe?g|png|gif)$/i;

export function isAllowedPropertyImage(file: File): boolean {
  if (ALLOWED_MIME.has(file.type)) return true;
  return ALLOWED_EXT.test(file.name);
}

export const PROPERTY_IMAGE_TYPE_ERROR =
  'Only JPG, PNG, or GIF images are allowed (WebP/HEIC are not supported).';
