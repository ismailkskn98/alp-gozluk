'use client';

import Image from 'next/image';
import { Link, usePathname } from '@/i18n/navigation';

const languages = [
  { code: 'tr', label: 'Türkçe', flagCode: 'tr' },
  { code: 'en', label: 'English', flagCode: 'gb' },
];

export default function LanguageSwitcher({ locale }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Dil seçimi" className="flex min-h-11 items-center text-xs text-[#232323]">
      {languages.map((language, index) => (
        <div key={language.code} className="flex items-center">
          {index ? <span aria-hidden="true" className="mx-1.5 h-4 w-px bg-black/20 sm:mx-2" /> : null}
          <Link
            href={pathname}
            locale={language.code}
            hrefLang={language.code}
            aria-current={locale === language.code ? 'page' : undefined}
            className={`inline-flex min-h-9 items-center rounded-full px-1.5 transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/30 focus-visible:ring-offset-2 ${locale === language.code ? 'opacity-100' : 'opacity-45'}`}
          >
            <Image
              src={`https://flagcdn.com/w40/${language.flagCode}.png`}
              alt=""
              width={20}
              height={15}
              sizes="20px"
              className="h-[15px] w-5 rounded-[2px] object-cover shadow-[0_0_0_1px_rgba(0,0,0,0.1)]"
            />
            <span className="sr-only">{language.label}</span>
          </Link>
        </div>
      ))}
    </nav>
  );
}
