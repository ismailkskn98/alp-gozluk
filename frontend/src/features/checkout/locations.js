import { useQuery } from '@tanstack/react-query';

async function fetchLocations(path, signal) {
  const response = await fetch(`/api/locations/${path}`, { signal });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.message || 'Konum bilgileri alınamadı.');
  return payload?.data?.locations || [];
}

const locationQuery = (queryKey, path, enabled = true) => ({
  queryKey,
  queryFn: ({ signal }) => fetchLocations(path, signal),
  enabled,
  staleTime: 60 * 60 * 1000,
  gcTime: 24 * 60 * 60 * 1000,
  retry: 1,
});

export function useProvinces() {
  return useQuery(locationQuery(['checkout', 'locations', 'provinces'], 'provinces'));
}

export function useDistricts(provinceId) {
  return useQuery(locationQuery(
    ['checkout', 'locations', 'districts', provinceId],
    `provinces/${provinceId}/districts`,
    Boolean(provinceId),
  ));
}

export function useNeighborhoods(districtId) {
  return useQuery(locationQuery(
    ['checkout', 'locations', 'neighborhoods', districtId],
    `districts/${districtId}/neighborhoods`,
    Boolean(districtId),
  ));
}
