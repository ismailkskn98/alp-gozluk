import { proxyAdminRequest } from '@/lib/admin-backend';

export async function GET(request) {
  return proxyAdminRequest(request, '/admin/homepage');
}

export async function PUT(request) {
  return proxyAdminRequest(request, '/admin/homepage', 'PUT');
}
