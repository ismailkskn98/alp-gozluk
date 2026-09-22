import { proxyAdminRequest } from '@/lib/admin-backend';

export async function GET(request) {
  return proxyAdminRequest(request, '/admin/announcements');
}

export async function POST(request) {
  return proxyAdminRequest(request, '/admin/announcements', 'POST');
}

