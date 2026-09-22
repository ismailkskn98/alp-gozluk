"use client";

import { ShoppingBag } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import CartItem from "./cart-item";
import CheckoutSteps from "./checkout-steps";
import OrderSummary from "./order-summary";
import CartRecommendations from "./recommendations";
import RemoveItemDialog from "./remove-item-dialog";
import { Link } from "@/i18n/navigation";
import { siteButtonVariants } from "@/components/site/ui/button";
import { SiteCheckbox } from "@/components/site/ui/checkbox";
import { cn } from "@/lib/utils";

export default function CartExperience({ locale, initialItems, recommendations }) {
  const t = useTranslations("Cart");
  const [items, setItems] = useState(initialItems);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponMessage, setCouponMessage] = useState("");
  const [selectedItemIds, setSelectedItemIds] = useState(() => new Set(initialItems.map((item) => item.id)));
  const [removeTarget, setRemoveTarget] = useState(null);

  const labels = useMemo(
    () => ({
      checkoutProgress: t("checkoutProgress"),
      cartSummary: t("cartSummary"),
      deliveryAndPayment: t("deliveryAndPayment"),
      orderResult: t("orderResult"),
      campaign: t("campaign"),
      campaignApplied: t("campaignApplied"),
      size: t("size"),
      quantity: t("quantity"),
      decreaseQuantity: t("decreaseQuantity"),
      increaseQuantity: t("increaseQuantity"),
      remove: t("remove"),
      viewProduct: t("viewProduct"),
      freeShippingReached: t("freeShippingReached"),
      subtotal: t("subtotal"),
      discount: t("discount"),
      shipping: t("shipping"),
      free: t("free"),
      total: t("total"),
      confirmCart: t("confirmCart"),
      continueShopping: t("continueShopping"),
      secureCheckout: t("secureCheckout"),
      promoTitle: t("promoTitle"),
      promoLabel: t("promoLabel"),
      promoPlaceholder: t("promoPlaceholder"),
      apply: t("apply"),
      recommendations: t("recommendations"),
      viewAll: t("viewAll"),
      selectAll: t("selectAll"),
      selectedProducts: t("selectedProducts"),
      includeItem: t("includeItem"),
      excludeItem: t("excludeItem"),
      excludedFromTotal: t("excludedFromTotal"),
      removeTitle: t("removeTitle"),
      removeDescription: t("removeDescription"),
      removeConfirm: t("removeConfirm"),
      cancel: t("cancel"),
      product: t("product"),
      closeRemoveDialog: t("closeRemoveDialog"),
    }),
    [t],
  );

  const formatCurrency = useMemo(
    () =>
      new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US", {
        style: "currency",
        currency: "TRY",
        maximumFractionDigits: 0,
      }).format,
    [locale],
  );

  const selectedItems = useMemo(
    () => items.filter((item) => selectedItemIds.has(item.id)),
    [items, selectedItemIds],
  );

  const totals = useMemo(() => {
    const subtotal = selectedItems.reduce((sum, item) => sum + item.originalPrice * item.quantity, 0);
    const saleTotal = selectedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const couponDiscount = couponApplied ? Math.round(saleTotal * 0.1) : 0;
    return {
      subtotal,
      discount: subtotal - saleTotal + couponDiscount,
      total: saleTotal - couponDiscount,
    };
  }, [couponApplied, selectedItems]);

  const itemCount = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const allSelected = items.length > 0 && selectedItems.length === items.length;

  function updateQuantity(id, quantity) {
    setItems((currentItems) => currentItems.map((item) => (item.id === id ? { ...item, quantity } : item)));
  }

  function toggleItem(id, checked) {
    setSelectedItemIds((currentIds) => {
      const nextIds = new Set(currentIds);
      if (checked) nextIds.add(id);
      else nextIds.delete(id);
      return nextIds;
    });
  }

  function toggleAll(checked) {
    setSelectedItemIds(checked ? new Set(items.map((item) => item.id)) : new Set());
  }

  function removeItem() {
    if (!removeTarget) return;
    const id = removeTarget.id;
    setItems((currentItems) => currentItems.filter((item) => item.id !== id));
    setSelectedItemIds((currentIds) => {
      const nextIds = new Set(currentIds);
      nextIds.delete(id);
      return nextIds;
    });
    setRemoveTarget(null);
  }

  function applyCoupon(event) {
    event.preventDefault();
    if (couponCode.trim().toUpperCase() === "ALP10") {
      setCouponApplied(true);
      setCouponMessage(t("promoSuccess"));
      return;
    }
    setCouponApplied(false);
    setCouponMessage(t("promoInvalid"));
  }

  return (
    <div>
      <CheckoutSteps itemCount={itemCount} labels={labels} />

      <div className="mt-[clamp(2rem,4vw,3.5rem)] flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{t("eyebrow")}</p>
          <h1 className="mt-2 text-[clamp(2.5rem,5vw,5.25rem)] font-light leading-[0.92] tracking-[-0.045em]">{t("title")}</h1>
        </div>
        <p className="max-w-md text-sm leading-6 text-muted-foreground">{t("description")}</p>
      </div>

      {items.length ? (
        <div className="mt-8 grid gap-x-[clamp(1.25rem,3vw,3rem)] gap-y-8 lg:grid-cols-[minmax(0,1fr)_clamp(19rem,24vw,23rem)]">
          <div className="min-w-0">
            <div className="mb-3 flex min-h-12 flex-wrap items-center justify-between gap-3 border-y border-[#d8ddd7] px-1 py-2.5">
              <SiteCheckbox
                checked={allSelected}
                indeterminate={selectedItems.length > 0 && !allSelected}
                onCheckedChange={toggleAll}
                label={labels.selectAll}
              />
              <p className="text-xs text-[#68736f]">{selectedItems.length} / {items.length} {labels.selectedProducts}</p>
            </div>
            <div className="mb-4 flex min-h-12 items-center justify-center bg-[#e9ece6] px-4 text-center text-sm">{t("campaign")}</div>
            <div className="space-y-2">
              {items.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  labels={labels}
                  locale={locale}
                  formatCurrency={formatCurrency}
                  selected={selectedItemIds.has(item.id)}
                  onSelectedChange={toggleItem}
                  onQuantityChange={updateQuantity}
                  onRemove={setRemoveTarget}
                />
              ))}
            </div>
          </div>

          <OrderSummary
            totals={totals}
            labels={labels}
            formatCurrency={formatCurrency}
            couponCode={couponCode}
            couponMessage={couponMessage}
            onCouponChange={setCouponCode}
            onCouponSubmit={applyCoupon}
            canCheckout={selectedItems.length > 0}
          />

          <div className="min-w-0 lg:col-start-1 lg:row-start-2">
            <CartRecommendations products={recommendations} labels={labels} locale={locale} formatCurrency={formatCurrency} />
          </div>
        </div>
      ) : (
        <div className="mt-10 border border-border bg-[#f7f7f4] px-6 py-16 text-center sm:py-24">
          <ShoppingBag className="mx-auto size-8" strokeWidth={1.25} />
          <h2 className="mt-5 text-3xl">{t("emptyTitle")}</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">{t("emptyDescription")}</p>
          <Link href="/shop" className={cn(siteButtonVariants(), "mt-7")}>
            {t("startShopping")}
          </Link>
        </div>
      )}

      <RemoveItemDialog
        open={Boolean(removeTarget)}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        item={removeTarget}
        labels={labels}
        onConfirm={removeItem}
      />
    </div>
  );
}
