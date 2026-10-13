import { proxyAdminFormDataRequest, proxyAdminRequest } from '@/lib/admin-backend';

export async function GET(request) {
  const search = new URL(request.url).search;
  return proxyAdminRequest(request, `/admin/media/list${search}`, 'GET');
}

export async function POST(request) {
  return proxyAdminFormDataRequest(request, '/admin/media/upload', 'POST');
}
