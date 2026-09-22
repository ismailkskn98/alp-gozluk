export const CART_ITEM_ADDED_EVENT = 'alp:cart:item-added';

export function announceCartItemAdded(detail = {}) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(CART_ITEM_ADDED_EVENT, { detail }));
}
