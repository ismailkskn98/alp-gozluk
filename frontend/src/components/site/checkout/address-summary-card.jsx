import { MapPin, PencilLine, Plus } from 'lucide-react';
import { SiteButton } from '@/components/site/ui/button';
import { formatTurkishPhone } from '@/features/checkout/phone';

export default function AddressSummaryCard({ eyebrow, title, address, emptyText, actionLabel, onAction }) {
  const complete = Boolean(address?.addressLine && address?.city && address?.district && address?.neighborhood);
  return (
    <section className="border border-[#d8ddd7] bg-white p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.13em] text-[#68736f]">{eyebrow}</p>
          <h2 className="mt-1 text-base font-medium text-[#172536]">{title}</h2>
        </div>
        <SiteButton type="button" variant="secondary" size="compact" className="min-h-9 shrink-0 rounded-none px-3 text-xs" onClick={onAction}>
          {complete ? <PencilLine className="size-3.5" /> : <Plus className="size-3.5" />}
          {actionLabel}
        </SiteButton>
      </div>
      {complete ? (
        <div className="mt-4 flex gap-3 border-t border-[#e1e5e2] pt-4">
          <MapPin className="mt-0.5 size-4 shrink-0 text-[#172536]" strokeWidth={1.6} />
          <address className="min-w-0 text-xs not-italic leading-5 text-[#52605a] sm:text-[0.8125rem]">
            <strong className="block truncate font-medium text-[#172536]">{address.title ? `${address.title} · ` : ''}{address.firstName} {address.lastName}</strong>
            <span className="line-clamp-2">{address.addressLine}</span>
            <span className="block">{address.neighborhood} · {address.district} / {address.city}{address.postalCode ? ` · ${address.postalCode}` : ''}</span>
            <span className="block">+90 {formatTurkishPhone(address.phone)}</span>
          </address>
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-3 border-t border-[#e1e5e2] pt-4 text-xs text-[#68736f]">
          <MapPin className="size-4 shrink-0" />{emptyText}
        </div>
      )}
    </section>
  );
}
