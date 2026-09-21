import { Search, ShoppingBag, UserRound } from 'lucide-react';
import { Link } from '@/i18n/navigation';

export default function HeaderActions({ locale, labels }) {
  const nextLocale = locale === 'tr' ? 'en' : 'tr';
  return (
    <div className="col-start-3 row-start-1 flex items-center justify-self-end">
      <Link href="/" locale={nextLocale} className="mr-1 hidden px-2 py-2 text-[0.68rem] text-[#666a70] hover:text-[#111] lg:block">
        {labels.language}
      </Link>
      <Link href="/search" aria-label={labels.search} className="grid size-9 place-items-center hover:bg-[#f4f5f6]">
        <Search className="size-4" strokeWidth={1.5} />
      </Link>
      <Link href="/login" aria-label={labels.account} className="hidden size-9 place-items-center hover:bg-[#f4f5f6] sm:grid">
        <UserRound className="size-4" strokeWidth={1.5} />
      </Link>
      <Link href="/cart" aria-label={labels.cart} className="grid size-9 place-items-center hover:bg-[#f4f5f6]">
        <ShoppingBag className="size-4" strokeWidth={1.5} />
      </Link>
    </div>
  );
}
