import { proxyAdminRequest } from '@/lib/admin-backend';

export async function GET(request, { params }) {
  const { resource } = await params;
  return proxyAdminRequest(request, `/admin/catalog/${encodeURIComponent(resource)}`);
}

export async function POST(request, { params }) {
  const { resource } = await params;
  return proxyAdminRequest(request, `/admin/catalog/${encodeURIComponent(resource)}`, 'POST');
}
