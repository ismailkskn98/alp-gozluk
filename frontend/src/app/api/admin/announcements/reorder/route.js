import { proxyAdminRequest } from '@/lib/admin-backend';

export async function PUT(request) {
  return proxyAdminRequest(request, '/admin/announcements/reorder', 'PUT');
}
