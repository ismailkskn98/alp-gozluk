'use client';

import { Check, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ShareButton({ name, locale }) {
  const [copied, setCopied] = useState(false);
  const tr = locale === 'tr';

  useEffect(() => {
    if (!copied) return undefined;
    const timeout = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  async function share() {
    const shareData = { title: name, url: window.location.href };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(shareData.url);
        setCopied(true);
      }
    } catch (error) {
      if (error?.name !== 'AbortError') setCopied(false);
    }
  }

  return (
    <button type="button" onClick={share} className="inline-flex min-h-10 shrink-0 items-center gap-2 border border-black/12 px-3 text-xs text-[#172536] transition-colors hover:border-[#172536] hover:bg-[#f4f6f7]" aria-label={tr ? `${name} ürününü paylaş` : `Share ${name}`}>
      {copied ? <Check className="size-3.5" strokeWidth={1.6} /> : <Share2 className="size-3.5" strokeWidth={1.5} />}
      <span className="hidden sm:inline">{copied ? (tr ? 'Bağlantı kopyalandı' : 'Link copied') : (tr ? 'Paylaş' : 'Share')}</span>
    </button>
  );
}
