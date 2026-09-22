import { ShoppingBag } from 'lucide-react';
import AccountAction from './account-action';
import SearchMenu from './search';
import { Link } from '@/i18n/navigation';

export default function HeaderActions({ authenticated, locale, labels, navigationItems, hasAnnouncement }) {
  return (
    <div className="col-start-3 row-start-1 flex items-center justify-self-end">
      <SearchMenu locale={locale} navigationItems={navigationItems} triggerLabel={labels.search} hasAnnouncement={hasAnnouncement} />
      <AccountAction authenticated={authenticated} locale={locale} label={labels.account} />
      <Link href="/cart" aria-label={labels.cart} className="grid size-11 place-items-center hover:bg-[#f4f5f6]">
        <ShoppingBag className="size-4" strokeWidth={1.5} />
      </Link>
    </div>
  );
}
