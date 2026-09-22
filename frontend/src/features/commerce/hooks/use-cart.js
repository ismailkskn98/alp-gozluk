'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addCartItem,
  applyCartCoupon,
  fetchCart,
  fetchCartSummary,
  removeCartCoupon,
  removeCartItem,
  updateCartItem,
  updateCartSelection,
} from '../api';
import { commerceKeys } from '../query-keys';

const itemMutationQueues = new Map();
const itemMutationVersions = new Map();

function canonicalCart(result) {
  return result?.cart || result || null;
}

function enqueueItemMutation(itemId, task) {
  const key = String(itemId);
  const previous = itemMutationQueues.get(key) || Promise.resolve();
  const current = previous.catch(() => undefined).then(task);
  itemMutationQueues.set(key, current);
  const cleanup = () => {
    if (itemMutationQueues.get(key) === current) itemMutationQueues.delete(key);
  };
  current.then(cleanup, cleanup);
  return current;
}

function beginItemMutation(itemId) {
  const key = String(itemId);
  const version = (itemMutationVersions.get(key) || 0) + 1;
  itemMutationVersions.set(key, version);
  return version;
}

function isLatestItemMutation(itemId, version) {
  return itemMutationVersions.get(String(itemId)) === version;
}

function replaceCart(queryClient, result) {
  const cart = canonicalCart(result);
  if (!cart) return;
  queryClient.setQueryData(commerceKeys.cart(), cart);
  if (cart.summary) queryClient.setQueryData(commerceKeys.cartSummary(), cart.summary);
}

function calculateOptimisticDiscount(cart, subtotalAmount) {
  const coupon = cart?.coupon;
  if (!coupon?.valid || subtotalAmount <= 0) return 0;
  if (coupon.minimumOrderAmount !== null && subtotalAmount < Number(coupon.minimumOrderAmount)) return 0;

  if (['percentage', 'percent'].includes(String(coupon.discountType).toLowerCase())) {
    return Math.min(subtotalAmount, subtotalAmount * Math.min(Number(coupon.discountValue) || 0, 100) / 100);
  }
  if (['fixed', 'amount'].includes(String(coupon.discountType).toLowerCase())) {
    return Math.min(subtotalAmount, Number(coupon.discountValue) || 0);
  }
  return 0;
}

function recalculateOptimisticCart(cart, items) {
  const summary = cart?.summary || {};
  const selectedItems = items.filter((item) => item.selected && item.available !== false);
  const subtotalAmount = selectedItems.reduce(
    (total, item) => total + (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0),
    0,
  );
  const discountAmount = calculateOptimisticDiscount(cart, subtotalAmount);
  const shippingAmount = Number(summary.shippingAmount) || 0;

  return {
    ...cart,
    items,
    summary: {
      ...summary,
      itemCount: items.reduce((total, item) => total + (Number(item.quantity) || 0), 0),
      selectedItemCount: selectedItems.reduce(
        (total, item) => total + (Number(item.quantity) || 0),
        0,
      ),
      subtotalAmount,
      discountAmount,
      shippingAmount,
      totalAmount: Math.max(0, subtotalAmount - discountAmount + shippingAmount),
      currency: summary.currency || 'TRY',
    },
  };
}

function updateItems(cart, transform) {
  if (!cart || !Array.isArray(cart.items)) return cart;
  return recalculateOptimisticCart(cart, transform(cart.items));
}

function setOptimisticCart(queryClient, updater) {
  const cart = queryClient.setQueryData(commerceKeys.cart(), updater);
  if (cart?.summary) queryClient.setQueryData(commerceKeys.cartSummary(), cart.summary);
}

function restoreCartSnapshot(queryClient, context) {
  queryClient.setQueryData(commerceKeys.cart(), context?.previousCart);
  queryClient.setQueryData(commerceKeys.cartSummary(), context?.previousSummary);
}

export function useCart(options = {}) {
  return useQuery({
    queryKey: commerceKeys.cart(),
    queryFn: fetchCart,
    ...options,
  });
}

export function useCartSummary(options = {}) {
  return useQuery({
    queryKey: commerceKeys.cartSummary(),
    queryFn: fetchCartSummary,
    ...options,
  });
}

export function useAddCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addCartItem,
    retry: 0,
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: commerceKeys.cart() });
      const previousCart = queryClient.getQueryData(commerceKeys.cart());
      const previousSummary = queryClient.getQueryData(commerceKeys.cartSummary());

      setOptimisticCart(queryClient, (cart) => {
        if (!cart || !Array.isArray(cart.items)) {
          if (!input.optimisticItem) return cart;
          return recalculateOptimisticCart(
            { items: [], coupon: null, summary: { currency: 'TRY', shippingAmount: 0 } },
            [{
              ...input.optimisticItem,
              id: input.optimisticItem.id || `optimistic-${input.variantId}`,
              productId: input.productId,
              variantId: input.variantId,
              quantity: input.quantity || 1,
              selected: true,
              pending: true,
            }],
          );
        }
        const existingIndex = cart.items.findIndex((item) => Number(item.variantId) === Number(input.variantId));
        if (existingIndex >= 0) {
          return updateItems(cart, (items) => items.map((item, index) => (
            index === existingIndex
              ? { ...item, quantity: item.quantity + (input.quantity || 1), pending: true }
              : item
          )));
        }

        if (!input.optimisticItem) return cart;
        return updateItems(cart, (items) => [
          ...items,
          {
            ...input.optimisticItem,
            id: input.optimisticItem.id || `optimistic-${input.variantId}`,
            productId: input.productId,
            variantId: input.variantId,
            quantity: input.quantity || 1,
            selected: true,
            pending: true,
          },
        ]);
      });

      return { previousCart, previousSummary };
    },
    onError: (_error, _input, context) => {
      restoreCartSnapshot(queryClient, context);
    },
    onSuccess: (result) => replaceCart(queryClient, result),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: commerceKeys.cart() });
      queryClient.invalidateQueries({ queryKey: commerceKeys.cartSummary() });
    },
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input) => enqueueItemMutation(input.itemId, () => updateCartItem(input)),
    retry: 0,
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: commerceKeys.cart() });
      const previousCart = queryClient.getQueryData(commerceKeys.cart());
      const previousSummary = queryClient.getQueryData(commerceKeys.cartSummary());
      const version = beginItemMutation(input.itemId);
      setOptimisticCart(queryClient, (cart) => updateItems(cart, (items) => items.map((item) => (
        String(item.id) === String(input.itemId)
          ? {
            ...item,
            ...(input.quantity === undefined ? {} : { quantity: input.quantity }),
            ...(input.selected === undefined ? {} : { selected: input.selected }),
            pending: true,
          }
          : item
      ))));
      return { previousCart, previousSummary, version };
    },
    onError: (_error, input, context) => {
      if (isLatestItemMutation(input.itemId, context?.version)) {
        restoreCartSnapshot(queryClient, context);
      }
    },
    onSuccess: (result, input, context) => {
      if (isLatestItemMutation(input.itemId, context?.version)) replaceCart(queryClient, result);
    },
    onSettled: (_result, _error, input, context) => {
      if (!isLatestItemMutation(input.itemId, context?.version)) return;
      queryClient.invalidateQueries({ queryKey: commerceKeys.cart() });
      queryClient.invalidateQueries({ queryKey: commerceKeys.cartSummary() });
    },
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeCartItem,
    retry: 0,
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: commerceKeys.cart() });
      const previousCart = queryClient.getQueryData(commerceKeys.cart());
      const previousSummary = queryClient.getQueryData(commerceKeys.cartSummary());
      setOptimisticCart(queryClient, (cart) => updateItems(
        cart,
        (items) => items.filter((item) => String(item.id) !== String(itemId)),
      ));
      return { previousCart, previousSummary };
    },
    onError: (_error, _itemId, context) => {
      restoreCartSnapshot(queryClient, context);
    },
    onSuccess: (result) => replaceCart(queryClient, result),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: commerceKeys.cart() });
      queryClient.invalidateQueries({ queryKey: commerceKeys.cartSummary() });
    },
  });
}

export function useUpdateCartSelection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCartSelection,
    retry: 0,
    onMutate: async ({ itemIds, selected }) => {
      await queryClient.cancelQueries({ queryKey: commerceKeys.cart() });
      const previousCart = queryClient.getQueryData(commerceKeys.cart());
      const previousSummary = queryClient.getQueryData(commerceKeys.cartSummary());
      const selectedIds = Array.isArray(itemIds) ? new Set(itemIds.map(String)) : null;
      setOptimisticCart(queryClient, (cart) => updateItems(cart, (items) => items.map((item) => (
        !selectedIds || selectedIds.has(String(item.id)) ? { ...item, selected, pending: true } : item
      ))));
      return { previousCart, previousSummary };
    },
    onError: (_error, _input, context) => {
      restoreCartSnapshot(queryClient, context);
    },
    onSuccess: (result) => replaceCart(queryClient, result),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: commerceKeys.cart() });
      queryClient.invalidateQueries({ queryKey: commerceKeys.cartSummary() });
    },
  });
}

function useCouponMutation(mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    retry: 0,
    onSuccess: (result) => replaceCart(queryClient, result),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: commerceKeys.cart() });
      queryClient.invalidateQueries({ queryKey: commerceKeys.cartSummary() });
    },
  });
}

export function useApplyCartCoupon() {
  return useCouponMutation(applyCartCoupon);
}

export function useRemoveCartCoupon() {
  return useCouponMutation(removeCartCoupon);
}
