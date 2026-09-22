export const PRODUCT_IMAGE_QUALITY = 90;

export function shouldUseOriginalProductImage(src) {
  return typeof src === 'string' && src.startsWith('/demo-gozlukler/');
}
