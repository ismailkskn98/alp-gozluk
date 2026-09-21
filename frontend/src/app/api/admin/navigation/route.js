import { proxyAdminRequest } from '@/lib/admin-backend';

export async function GET(request) {
  return proxyAdminRequest(request, '/admin/navigation/header');
}

export async function PUT(request) {
  return proxyAdminRequest(request, '/admin/navigation/header', 'PUT');
}
