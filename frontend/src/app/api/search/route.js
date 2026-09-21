import { NextResponse } from 'next/server';
import { listProducts } from '@/data/products';

const supportedLocales = new Set(['tr', 'en']);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const requestedLocale = searchParams.get('locale');
  const locale = supportedLocales.has(requestedLocale) ? requestedLocale : 'tr';
  const search = String(searchParams.get('q') || '').trim();

  if (search.length > 80) {
    return NextResponse.json(
      {
        status: false,
        message: locale === 'tr' ? 'Arama metni çok uzun.' : 'The search query is too long.',
      },
      { status: 422 },
    );
  }

  const products = await listProducts(locale, {
    search,
    limit: 6,
    sort: search ? 'popular' : 'featured',
  });

  return NextResponse.json(
    {
      status: true,
      message: locale === 'tr' ? 'Arama sonuçları hazır.' : 'Search results are ready.',
      data: { products: products.slice(0, 6) },
    },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
