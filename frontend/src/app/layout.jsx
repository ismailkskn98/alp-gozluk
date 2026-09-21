import localFont from 'next/font/local';
import { getLocale } from 'next-intl/server';
import './globals.css';

const hkGrotesk = localFont({
  src: [
    { path: '../fonts/hkgrotesk/HKGrotesk-Light.woff2', weight: '300', style: 'normal' },
    { path: '../fonts/hkgrotesk/HKGrotesk-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/hkgrotesk/HKGrotesk-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../fonts/hkgrotesk/HKGrotesk-SemiBold.woff2', weight: '600', style: 'normal' },
    { path: '../fonts/hkgrotesk/HKGrotesk-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-hk-grotesk',
  display: 'swap',
  fallback: ['Arial', 'sans-serif'],
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
      <body className={hkGrotesk.variable}>
        {children}
      </body>
    </html>
  );
}
