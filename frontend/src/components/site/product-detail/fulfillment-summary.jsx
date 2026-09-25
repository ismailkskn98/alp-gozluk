import { RotateCcw, Truck } from 'lucide-react';

function addBusinessDays(source, dayCount) {
  const date = new Date(source);
  let remaining = Math.max(0, dayCount);
  while (remaining > 0) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) remaining -= 1;
  }
  return date;
}

function dateRange(settings, locale) {
  const today = new Date();
  const earliest = addBusinessDays(today, settings.dispatchMinDays);
  const latest = addBusinessDays(today, settings.dispatchMaxDays);
  const formatter = new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short' });
  if (earliest.toDateString() === latest.toDateString()) return formatter.format(earliest);
  return `${formatter.format(earliest)} – ${formatter.format(latest)}`;
}

export default function FulfillmentSummary({ settings, locale }) {
  const tr = locale === 'tr';
  return (
    <div className="mt-5 grid grid-cols-2 gap-2">
      <div className="flex min-h-20 items-start gap-3 bg-[#f4f5f5] p-3.5">
        <Truck className="mt-0.5 size-4 shrink-0 text-[#172536]" strokeWidth={1.45} />
        <p className="text-[0.68rem] leading-4 text-muted-foreground">
          {tr ? 'Tahmini kargoya veriliş' : 'Estimated dispatch'}
          <strong className="mt-1 block text-xs font-medium text-foreground">{dateRange(settings, locale)}</strong>
        </p>
      </div>
      <div className="flex min-h-20 items-start gap-3 bg-[#f4f5f5] p-3.5">
        <RotateCcw className="mt-0.5 size-4 shrink-0 text-[#172536]" strokeWidth={1.45} />
        <p className="text-[0.68rem] leading-4 text-muted-foreground">
          {tr ? 'Teslimden itibaren' : 'After delivery'}
          <strong className="mt-1 block text-xs font-medium text-foreground">{settings.returnWindowDays} {tr ? 'gün iade süresi' : 'day return window'}</strong>
        </p>
      </div>
    </div>
  );
}
