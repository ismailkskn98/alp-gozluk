import { ShoppingBag } from 'lucide-react';
import { Link } from '@/i18n/navigation';

export default async function CartPage({ params }) {
  const { locale } = await params; const tr = locale === 'tr';
  return <section className="grid-container py-24"><div className="mx-auto max-w-xl text-center"><div className="mx-auto grid size-14 place-items-center rounded-full bg-muted"><ShoppingBag className="size-6" /></div><h1 className="mt-6 text-5xl">{tr ? 'Sepetin boş' : 'Your cart is empty'}</h1><p className="mt-4 text-muted-foreground">{tr ? 'Yeni bir çerçeve keşfetmek için koleksiyona göz at.' : 'Browse the collection to discover a new frame.'}</p><Link href="/shop" className="mt-7 inline-flex h-11 items-center rounded-md bg-primary px-5 text-sm font-semibold text-white">{tr ? 'Alışverişe başla' : 'Start shopping'}</Link></div></section>;
}
