import { Geist, Instrument_Serif } from 'next/font/google';
import { getLocale } from 'next-intl/server';
import './globals.css';

const geist = Geist({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-geist',
  display: 'swap',
});

const instrumentSerif = Instrument_Serif({
  weight: '400',
  subsets: ['latin', 'latin-ext'],
  variable: '--font-instrument-serif',
  display: 'swap',
});

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'ALP Gözlük',
    template: '%s | ALP Gözlük',
  },
  description: 'ALP Gözlük resmi online mağazası.',
};

export default async function RootLayout({ children }) {
  const locale = await getLocale();

  return (
    <html lang={locale}>
      <body className={`${geist.variable} ${instrumentSerif.variable}`}>
        {children}
      </body>
    </html>
  );
}
