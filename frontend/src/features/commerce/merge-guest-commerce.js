import { mergeGuestCart, mergeGuestFavorites } from './api';
import { clearGuestFavorites, readGuestFavoriteIds } from './guest-favorites';

export const commerceAuthenticationMergedEvent = 'alp:commerce-authenticated';

export async function mergeGuestCommerceAfterAuthentication() {
  if (typeof window === 'undefined') return { cart: false, favorites: false };

  const guestFavoriteIds = readGuestFavoriteIds();
  const cartPromise = mergeGuestCart().then(() => true).catch(() => false);
  const favoritesPromise = guestFavoriteIds.length
    ? mergeGuestFavorites(guestFavoriteIds)
      .then(() => {
        clearGuestFavorites();
        return true;
      })
      .catch(() => false)
    : Promise.resolve(true);

  const [cart, favorites] = await Promise.all([cartPromise, favoritesPromise]);
  window.dispatchEvent(new CustomEvent(commerceAuthenticationMergedEvent));
  return { cart, favorites };
}
