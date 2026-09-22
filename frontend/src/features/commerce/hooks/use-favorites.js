'use client';

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addFavorite,
  fetchFavoriteIds,
  fetchFavorites,
  mergeGuestFavorites,
  removeFavorite,
} from '../api';
import {
  addGuestFavorite,
  clearGuestFavorites,
  guestFavoritesChangedEvent,
  guestFavoritesStorageKey,
  readGuestFavoriteIds,
  removeGuestFavorite,
} from '../guest-favorites';
import { commerceKeys } from '../query-keys';

let activeGuestFavoriteMerge = null;

async function retryGuestFavoriteMerge(queryClient) {
  const productIds = readGuestFavoriteIds();
  if (!productIds.length) return;

  if (!activeGuestFavoriteMerge) {
    activeGuestFavoriteMerge = mergeGuestFavorites(productIds)
      .then((result) => {
        clearGuestFavorites();
        if (Array.isArray(result?.ids)) {
          queryClient.setQueryData(commerceKeys.favoriteIds(), result.ids.map(Number));
        }
        if (Array.isArray(result?.favorites)) {
          queryClient.setQueryData(commerceKeys.favorites(), result.favorites);
        }
      })
      .finally(() => {
        activeGuestFavoriteMerge = null;
      });
  }

  try {
    await activeGuestFavoriteMerge;
  } catch {
    // Giriş başarısız sayılmaz; bir sonraki favori sorgusu merge işlemini tekrar dener.
  }
}

export function useFavoriteIds({ authenticated = false } = {}) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (authenticated) return undefined;

    const syncGuestFavorites = (event) => {
      if (event.type === 'storage' && event.key !== guestFavoritesStorageKey) return;
      queryClient.setQueryData(commerceKeys.favoriteIds(), readGuestFavoriteIds());
    };

    syncGuestFavorites({ type: 'initial' });
    window.addEventListener('storage', syncGuestFavorites);
    window.addEventListener(guestFavoritesChangedEvent, syncGuestFavorites);
    return () => {
      window.removeEventListener('storage', syncGuestFavorites);
      window.removeEventListener(guestFavoritesChangedEvent, syncGuestFavorites);
    };
  }, [authenticated, queryClient]);

  return useQuery({
    queryKey: commerceKeys.favoriteIds(),
    queryFn: authenticated
      ? async () => {
        await retryGuestFavoriteMerge(queryClient);
        return fetchFavoriteIds();
      }
      : readGuestFavoriteIds,
    staleTime: authenticated ? 30_000 : Infinity,
  });
}

export function useFavorites({ authenticated = false } = {}) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authenticated) queryClient.setQueryData(commerceKeys.favorites(), []);
  }, [authenticated, queryClient]);

  return useQuery({
    queryKey: commerceKeys.favorites(),
    queryFn: async () => {
      await retryGuestFavoriteMerge(queryClient);
      return fetchFavorites();
    },
    enabled: authenticated,
    initialData: authenticated ? undefined : [],
  });
}

export function useToggleFavorite({ authenticated = false } = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, isFavorite }) => {
      if (!authenticated) {
        return isFavorite ? removeGuestFavorite(productId) : addGuestFavorite(productId);
      }
      return isFavorite ? removeFavorite(productId) : addFavorite(productId);
    },
    retry: 0,
    onMutate: async ({ productId, isFavorite, product }) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: commerceKeys.favoriteIds() }),
        queryClient.cancelQueries({ queryKey: commerceKeys.favorites() }),
      ]);
      const previousIds = queryClient.getQueryData(commerceKeys.favoriteIds()) || [];
      const previousFavorites = queryClient.getQueryData(commerceKeys.favorites()) || [];
      const normalizedId = Number(productId);

      queryClient.setQueryData(commerceKeys.favoriteIds(), isFavorite
        ? previousIds.filter((id) => Number(id) !== normalizedId)
        : [normalizedId, ...previousIds.filter((id) => Number(id) !== normalizedId)]);

      if (isFavorite) {
        queryClient.setQueryData(
          commerceKeys.favorites(),
          previousFavorites.filter((favorite) => Number(favorite.id) !== normalizedId),
        );
      } else if (product) {
        queryClient.setQueryData(commerceKeys.favorites(), [product, ...previousFavorites]);
      }

      return { previousIds, previousFavorites };
    },
    onError: (_error, _input, context) => {
      queryClient.setQueryData(commerceKeys.favoriteIds(), context?.previousIds || []);
      queryClient.setQueryData(commerceKeys.favorites(), context?.previousFavorites || []);
    },
    onSuccess: (result) => {
      if (!authenticated && Array.isArray(result)) {
        queryClient.setQueryData(commerceKeys.favoriteIds(), result);
      }
      if (authenticated && Array.isArray(result?.ids)) {
        queryClient.setQueryData(commerceKeys.favoriteIds(), result.ids.map(Number));
      }
      if (authenticated && Array.isArray(result?.favorites)) {
        queryClient.setQueryData(commerceKeys.favorites(), result.favorites);
      }
    },
    onSettled: () => {
      if (!authenticated) return;
      queryClient.invalidateQueries({ queryKey: commerceKeys.favoriteIds() });
      queryClient.invalidateQueries({ queryKey: commerceKeys.favorites() });
    },
  });
}
