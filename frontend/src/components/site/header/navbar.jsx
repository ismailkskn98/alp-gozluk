import { Link } from '@/i18n/navigation';

export default function Navbar({ items, label }) {
  return (
    <nav aria-label={label} className="col-start-2 row-start-1 hidden items-center justify-center gap-[clamp(1.25rem,2.5vw,2.75rem)] md:flex">
      {items.map((item) => (
        <Link key={item.href} href={item.href} className="text-xs font-normal text-[#4f5357] transition-colors duration-150 hover:text-[#111]">
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
