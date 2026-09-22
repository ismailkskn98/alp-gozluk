import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';

export default function SearchSuggestions({
  categories,
  labels,
  onNavigate,
  onSelectQuery,
  quickSearches,
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-[0.75fr_0.75fr_1.35fr] lg:gap-[clamp(2rem,4vw,4rem)]">
      <section>
        <h2 className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {labels.categories}
        </h2>
        <ul className="mt-3 space-y-0.5">
          {categories.map((category) => (
            <li key={category.code}>
              <Link
                href={category.href || '/shop'}
                onClick={onNavigate}
                className="group flex min-h-10 items-center justify-between border-b border-black/8 text-[0.92rem] text-foreground"
              >
                {category.label}
                <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {labels.popularSearches}
        </h2>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 lg:flex-col lg:items-start">
          {quickSearches.map((searchItem) => (
            <button
              key={searchItem.value}
              type="button"
              className="min-h-10 border-b border-black/10 px-0 text-left text-[0.92rem] text-foreground transition-colors hover:border-black"
              onClick={() => onSelectQuery(searchItem.value)}
            >
              {searchItem.label}
            </button>
          ))}
        </div>
      </section>

      <div className="relative hidden min-h-44 overflow-hidden bg-[#e9ecec] lg:block">
        <Image
          src="/mockup-gozlukler/16@9x.png"
          alt=""
          fill
          sizes="(min-width: 1440px) 40rem, 38vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
        <p className="absolute bottom-5 left-5 max-w-[18ch] text-xl leading-[1.05] text-white">
          {labels.promo}
        </p>
      </div>
    </div>
  );
}
