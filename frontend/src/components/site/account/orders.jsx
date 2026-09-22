"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Box, Package, PackageOpen, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { AnimatedBadge } from "@/components/motion/animated-badge";
import { GooeyNav } from "@/components/ui/gooey-nav";
import { Link } from "@/i18n/navigation";
import AccountSectionHeader from "./section-header";

const orderStatus = {
  pending: { label: "Hazırlanıyor", badge: "warning" },
  paid: { label: "Ödendi", badge: "info" },
  cancelled: { label: "İptal edildi", badge: "danger" },
  completed: { label: "Tamamlandı", badge: "success" },
  shipped: { label: "Kargoda", badge: "info" },
  delivered: { label: "Teslim edildi", badge: "success" },
};

const returnStatus = {
  requested: { label: "İnceleniyor", badge: "warning" },
  approved: { label: "İade onaylandı", badge: "success" },
  rejected: { label: "İade reddedildi", badge: "danger" },
  refunded: { label: "Ücret iade edildi", badge: "success" },
};

function formatMoney(amount, currency, locale) {
  return new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function formatDate(value, locale) {
  return new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function ProductThumbs({ products = [] }) {
  if (!products.length)
    return (
      <span className="grid size-20 place-items-center bg-white text-[#87918d]">
        <Box className="size-5" strokeWidth={1.35} />
      </span>
    );
  return (
    <div className="flex -space-x-2">
      {products.slice(0, 3).map((product) => (
        <div key={product.id || product.slug} className="relative size-20 overflow-hidden border-2 border-[#f7f8f5] bg-white">
          <Image src={product.imageUrl} alt="" fill sizes="80px" className="object-contain" />
        </div>
      ))}
    </div>
  );
}

function ProductLine({ product, locale }) {
  return (
    <div className="grid grid-cols-[5rem_minmax(0,1fr)] gap-4 border-b border-[#e0e4e1] py-4 last:border-0 sm:grid-cols-[5rem_minmax(0,1fr)_auto] sm:items-center">
      <div className="relative aspect-[4/5] bg-white">{product.imageUrl ? <Image src={product.imageUrl} alt={product.name} fill sizes="80px" className="object-contain" /> : null}</div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-[#172536]">{product.name}</p>
        <p className="mt-1 text-xs text-[#68736f]">{product.variant || "Standart ürün"}</p>
      </div>
      <p className="col-start-2 text-sm font-medium text-[#172536] tabular-nums sm:col-auto">{formatMoney(product.priceAmount, product.currency || "TRY", locale)}</p>
    </div>
  );
}

function OrderDetail({ order, locale, onClose }) {
  const reduceMotion = useReducedMotion();
  const state = orderStatus[order.fulfillmentStatus] || orderStatus[order.status] || orderStatus.pending;
  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, y: 6 }}
      transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeOut" }}
      className="mt-7"
    >
      <button type="button" onClick={onClose} className="inline-flex items-center gap-2 text-sm text-[#58645f] hover:text-[#172536]">
        <ArrowLeft className="size-4" /> Siparişlere dön
      </button>
      <div className="mt-5 flex flex-col gap-5 border-y border-[#d8ddd7] py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-[#68736f]">Sipariş #{order.orderNumber}</p>
          <p className="mt-1 text-lg font-medium text-[#172536]">{formatDate(order.placedAt, locale)}</p>
        </div>
        <AnimatedBadge status={state.badge} size="sm">
          {state.label}
        </AnimatedBadge>
      </div>
      <div className="grid gap-[clamp(2rem,5vw,4.5rem)] py-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div>
          <h3 className="text-sm font-medium text-[#172536]">Ürünler</h3>
          <div className="mt-2">
            {(order.items || []).map((product) => (
              <ProductLine key={product.id || product.slug} product={product} locale={locale} />
            ))}
          </div>
        </div>
        <dl className="space-y-4 border-l border-[#d8ddd7] pl-5 text-sm">
          <div>
            <dt className="text-xs text-[#68736f]">Teslimat</dt>
            <dd className="mt-1 text-[#172536]">{order.address || "Kayıtlı teslimat adresi"}</dd>
          </div>
          {order.shipment ? (
            <div>
              <dt className="text-xs text-[#68736f]">Kargo</dt>
              <dd className="mt-1 text-[#172536]">
                {order.shipment.company}
                <br />
                <span className="tabular-nums">{order.shipment.trackingNumber}</span>
              </dd>
            </div>
          ) : null}
          <div className="flex items-end justify-between border-t border-[#d8ddd7] pt-4">
            <dt className="text-[#68736f]">Toplam</dt>
            <dd className="text-base font-medium text-[#172536] tabular-nums">{formatMoney(order.totalAmount, order.currency, locale)}</dd>
          </div>
        </dl>
      </div>
    </motion.section>
  );
}

function OrdersList({ orders, locale, onSelect }) {
  if (!orders.length) return <EmptyState icon={PackageOpen} title="Henüz siparişin yok" description="İlk çerçeveni seçtiğinde teslimat sürecini burada takip edebilirsin." />;
  return (
    <div className="divide-y divide-[#d8ddd7] border-y border-[#d8ddd7]">
      {orders.map((order) => {
        const state = orderStatus[order.fulfillmentStatus] || orderStatus[order.status] || orderStatus.pending;
        return (
          <button key={order.orderNumber} type="button" onClick={() => onSelect(order)} className="group grid w-full gap-5 py-5 text-left md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
            <ProductThumbs products={order.items} />
            <span className="min-w-0">
              <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="font-medium text-[#172536]">#{order.orderNumber}</span>
                <AnimatedBadge status={state.badge} size="sm">
                  {state.label}
                </AnimatedBadge>
              </span>
              <span className="mt-2 block text-sm text-[#68736f]">
                {formatDate(order.placedAt, locale)} · {order.itemCount} ürün
              </span>
            </span>
            <span className="flex items-center justify-between gap-6 md:justify-end">
              <span className="font-medium text-[#172536] tabular-nums">{formatMoney(order.totalAmount, order.currency, locale)}</span>
              <ArrowRight className="size-4 text-[#82908a] transition-transform group-hover:translate-x-1" />
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ReturnsList({ returns, locale }) {
  if (!returns.length) return <EmptyState icon={RotateCcw} title="Aktif iade talebin yok" description="Bir iade başlattığında inceleme ve ücret aktarımı adımlarını burada görebilirsin." />;
  return (
    <div className="divide-y divide-[#d8ddd7] border-y border-[#d8ddd7]">
      {returns.map((request) => {
        const state = returnStatus[request.status] || returnStatus.requested;
        return (
          <article key={request.returnNumber} className="grid gap-5 py-5 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
            <ProductThumbs products={request.items} />
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <p className="font-medium text-[#172536]">#{request.returnNumber}</p>
                <AnimatedBadge status={state.badge} size="sm">
                  {state.label}
                </AnimatedBadge>
              </div>
              <p className="mt-2 text-sm text-[#68736f]">
                Sipariş #{request.orderNumber} · {formatDate(request.requestedAt, locale)}
              </p>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#46534e]">{request.reason}</p>
            </div>
            <div className="md:text-right">
              <p className="text-xs text-[#68736f]">İade tutarı</p>
              <p className="mt-1 font-medium text-[#172536] tabular-nums">{formatMoney(request.refundAmount, request.currency, locale)}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="border-y border-[#d8ddd7] py-14 text-center">
      <Icon className="mx-auto size-6 text-[#7a8781]" strokeWidth={1.35} />
      <h3 className="mt-4 text-lg text-[#172536]">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#68736f]">{description}</p>
      <Link href="/shop" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[#172536]">
        Gözlükleri keşfet <ArrowRight className="size-3.5" />
      </Link>
    </div>
  );
}

export default function Orders({ orders, returns, locale }) {
  const [tab, setTab] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const reduceMotion = useReducedMotion();
  const tabs = useMemo(() => [
    { label: `Siparişler (${orders.length})`, icon: <Package strokeWidth={1.55} /> },
    { label: `İadeler (${returns.length})`, icon: <RotateCcw strokeWidth={1.55} /> },
  ], [orders.length, returns.length]);

  return (
    <section>
      <AccountSectionHeader kicker="Alışveriş geçmişin" title="Siparişlerim" description="Kargonu takip et, sipariş ayrıntılarını incele ve iade süreçlerini tek yerden gör." />
      <div className="mt-5 border-b border-[#d8ddd7] pb-4">
        <GooeyNav
          items={tabs}
          value={tab}
          onChange={(value) => {
            setTab(value);
            setSelectedOrder(null);
          }}
          size="sm"
          activeColor="#eaf1fb"
          activeLabelColor="#1d4f83"
          inactiveLabelColor="#71807c"
          surfaceColor="transparent"
          separation={10}
          radius={8}
          className="max-w-full [&_[data-slot='gooey-nav-item']]:min-h-9 [&_[data-slot='gooey-nav-item']]:px-3 [&_[data-slot='gooey-nav-item']]:text-[0.8125rem]"
          aria-label="Sipariş ve iade kayıtları"
        />
      </div>
      <div className="mt-6">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${tab}-${selectedOrder?.orderNumber || "list"}`}
            initial={reduceMotion ? false : { opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
          >
            {selectedOrder ? (
              <OrderDetail order={selectedOrder} locale={locale} onClose={() => setSelectedOrder(null)} />
            ) : tab === 0 ? (
              <OrdersList orders={orders} locale={locale} onSelect={setSelectedOrder} />
            ) : (
              <ReturnsList returns={returns} locale={locale} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
