import { proxyAdminRequest } from '@/lib/admin-backend';

export async function GET(request) {
  return proxyAdminRequest(request, '/admin/users/roles');
}
