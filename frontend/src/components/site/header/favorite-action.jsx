import { Heart } from 'lucide-react';
import { Link } from '@/i18n/navigation';

const favoriteDestination = '/account?section=favorites';

export default function FavoriteAction({ authenticated, label, loginLabel }) {
  const href = authenticated
    ? favoriteDestination
    : `/login?next=${encodeURIComponent(favoriteDestination)}`;

  return (
    <Link
      href={href}
      aria-label={authenticated ? label : loginLabel}
      title={authenticated ? label : loginLabel}
      className="inline-flex h-11 items-center px-2.5 text-[#172536] transition-colors hover:bg-[#f4f5f6]"
    >
      <Heart className="size-4" strokeWidth={1.5} />
    </Link>
  );
}
