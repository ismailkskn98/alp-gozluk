import Image from 'next/image';
import { ArrowRight, Heart, MapPin, Package } from 'lucide-react';

function formatMoney(amount, currency, locale) {
  return new Intl.NumberFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function SummaryLink({ icon: Icon, value, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-w-0 items-center gap-4 border-b border-[#d8ddd7] py-4 text-left last:border-b-0 sm:border-b-0 sm:border-r sm:px-5 sm:first:pl-0 sm:last:border-r-0"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-full border border-[#cfd5d1] bg-white text-[#172536]">
        <Icon className="size-4" strokeWidth={1.45} />
      </span>
      <span className="min-w-0">
        <span className="block text-xl leading-none tracking-[-0.04em] text-[#172536] tabular-nums">{value}</span>
        <span className="mt-1.5 block truncate text-xs text-[#68736f]">{label}</span>
      </span>
      <ArrowRight className="ml-auto size-3.5 shrink-0 text-[#82908a] transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

function ProductStack({ products }) {
  return (
    <div className="flex -space-x-3">
      {products.slice(0, 3).map((product) => (
        <div key={product.id || product.slug} className="relative size-14 overflow-hidden rounded-full border-2 border-[#f7f8f5] bg-white">
          {product.imageUrl ? (
            <Image src={product.imageUrl} alt="" fill sizes="56px" className="object-contain" />
          ) : null}
        </div>
      ))}
    </div>
  );
}

export default function AccountOverview({ account, onNavigate, locale }) {
  const orders = account?.orders || [];
  const addresses = account?.addresses || [];
  const favorites = account?.favorites || [];
  const latestOrder = orders[0];

  return (
    <div className="space-y-[clamp(2.25rem,5vw,4.5rem)]">
      <section aria-label="Hesap özeti" className="grid border-y border-[#d8ddd7] sm:grid-cols-3">
        <SummaryLink icon={Package} value={orders.length} label="Sipariş" onClick={() => onNavigate('orders')} />
        <SummaryLink icon={MapPin} value={addresses.length} label="Kayıtlı adres" onClick={() => onNavigate('addresses')} />
        <SummaryLink icon={Heart} value={favorites.length} label="Favori çerçeve" onClick={() => onNavigate('favorites')} />
      </section>

      {latestOrder ? (
        <section>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-[clamp(1.35rem,2vw,1.75rem)] font-normal tracking-[-0.035em] text-[#172536]">Son siparişin</h2>
              <p className="mt-1 text-sm text-[#68736f]">#{latestOrder.orderNumber}</p>
            </div>
            <button type="button" onClick={() => onNavigate('orders')} className="group inline-flex items-center gap-2 text-sm text-[#172536]">
              Tüm siparişler <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('orders')}
            className="group mt-5 grid w-full gap-5 border-y border-[#d8ddd7] py-5 text-left sm:grid-cols-[auto_1fr_auto] sm:items-center"
          >
            <ProductStack products={latestOrder.items || []} />
            <span>
              <span className="block text-base font-medium text-[#172536]">
                {latestOrder.fulfillmentStatus === 'shipped' ? 'Siparişin yolda' : 'Siparişin teslim edildi'}
              </span>
              <span className="mt-1 block text-sm text-[#68736f]">
                {latestOrder.itemCount} ürün · {latestOrder.address || 'Teslimat adresin'}
              </span>
            </span>
            <span className="flex items-center justify-between gap-5 sm:justify-end">
              <span className="text-sm font-medium text-[#172536] tabular-nums">
                {formatMoney(latestOrder.totalAmount, latestOrder.currency, locale)}
              </span>
              <ArrowRight className="size-4 text-[#82908a] transition-transform group-hover:translate-x-1" />
            </span>
          </button>
        </section>
      ) : null}

      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-[clamp(1.35rem,2vw,1.75rem)] font-normal tracking-[-0.035em] text-[#172536]">Kaydettiklerin</h2>
            <p className="mt-1 text-sm text-[#68736f]">Son baktığın çerçevelere kaldığın yerden devam et.</p>
          </div>
          <button type="button" onClick={() => onNavigate('favorites')} className="hidden items-center gap-2 text-sm sm:inline-flex">
            Favorilerim <ArrowRight className="size-3.5" />
          </button>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-7 md:grid-cols-4">
          {favorites.slice(0, 4).map((product) => (
            <button key={product.id} type="button" onClick={() => onNavigate('favorites')} className="group text-left">
              <span className="relative block aspect-[4/5] overflow-hidden bg-white">
                {product.imageUrl ? <Image src={product.imageUrl} alt={product.name} fill sizes="(max-width: 768px) 50vw, 20vw" className="object-contain transition-transform duration-500 group-hover:scale-[1.025]" /> : null}
              </span>
              <span className="mt-3 block truncate text-sm font-medium text-[#172536]">{product.name}</span>
              <span className="mt-1 block text-xs text-[#68736f]">{product.variant || 'Favorilerine eklendi'}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
