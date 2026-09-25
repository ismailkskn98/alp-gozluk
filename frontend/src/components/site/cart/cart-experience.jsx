"use client";

import { AlertCircle, RefreshCw, ShoppingBag } from "lucide-react";
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
import {
  useApplyCartCoupon,
  useCart,
  useCartSummary,
  useRemoveCartItem,
  useToggleFavorite,
  useUpdateCartItem,
  useUpdateCartSelection,
} from "@/features/commerce";

function localized(value, locale, fallback = "") {
  if (typeof value === "string") return value;
  return value?.[locale] || value?.tr || value?.en || fallback;
}

function productImage(item) {
  return item.image?.url || item.image || item.imageUrl || item.product?.imageUrl || item.product?.primaryImage?.url || item.product?.images?.[0]?.url || item.product?.images?.[0] || "";
}

function normalizeItem(item, locale) {
  const product = item.product || {};
  const variant = item.variant || {};
  return {
    ...item,
    id: item.id ?? item.cartItemId,
    productId: item.productId ?? product.id,
    variantId: item.variantId ?? variant.id,
    slug: item.slug || product.slug || "",
    name: item.name || localized(product.name, locale, "Ürün"),
    category: item.category || product.category || product.type || { tr: "Gözlük", en: "Eyewear" },
    color: item.color || item.colorCode || variant.color || variant.colorName || { tr: "Standart", en: "Standard" },
    size: item.size || item.frameSize || variant.frameSize || variant.size || "—",
    image: productImage(item),
    imageAlt: item.image?.altText || item.imageAlt || "",
    unitPrice: Number(item.currentUnitPrice ?? item.unitPrice ?? variant.price ?? 0),
    originalPrice: Number(item.compareAtPrice ?? item.originalPrice ?? item.currentUnitPrice ?? item.unitPrice ?? variant.price ?? 0),
    quantity: Number(item.quantity || 1),
    selected: item.selected ?? item.isSelected ?? true,
    available: item.available !== false,
    stockQuantity: Number(item.stockQuantity ?? variant.stockQuantity ?? 10),
    warnings: Array.isArray(item.warnings) ? item.warnings : [],
  };
}

function emptySummary() {
  return {
    totalItemCount: 0,
    selectedItemCount: 0,
    subtotalAmount: 0,
    discountAmount: 0,
    shippingAmount: 0,
    totalAmount: 0,
    currency: "TRY",
  };
}

export default function CartExperience({ locale, recommendations, authenticated = false }) {
  const t = useTranslations("Cart");
  const cartQuery = useCart();
  const cartSummaryQuery = useCartSummary();
  const updateItem = useUpdateCartItem();
  const updateSelection = useUpdateCartSelection();
  const removeCartItem = useRemoveCartItem();
  const applyCartCoupon = useApplyCartCoupon();
  const toggleFavorite = useToggleFavorite({ authenticated });
  const [couponCode, setCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [removeTarget, setRemoveTarget] = useState(null);
  const [liveMessage, setLiveMessage] = useState("");

  const remoteItems = useMemo(() => (cartQuery.data?.items || []).map((item) => normalizeItem(item, locale)), [cartQuery.data?.items, locale]);
  const items = remoteItems;
  const summary = cartSummaryQuery.data || cartQuery.data?.summary || emptySummary();

  const labels = useMemo(() => ({
    checkoutProgress: t("checkoutProgress"), cartSummary: t("cartSummary"), deliveryAndPayment: t("deliveryAndPayment"), orderResult: t("orderResult"),
    campaign: t("campaign"), campaignApplied: t("campaignApplied"), size: t("size"), quantity: t("quantity"), decreaseQuantity: t("decreaseQuantity"),
    increaseQuantity: t("increaseQuantity"), remove: t("remove"), viewProduct: t("viewProduct"), freeShippingReached: t("freeShippingReached"),
    subtotal: t("subtotal"), discount: t("discount"), shipping: t("shipping"), free: t("free"), total: t("total"), confirmCart: t("confirmCart"),
    continueShopping: t("continueShopping"), secureCheckout: t("secureCheckout"), promoTitle: t("promoTitle"), promoLabel: t("promoLabel"),
    promoPlaceholder: t("promoPlaceholder"), apply: t("apply"), recommendations: t("recommendations"), viewAll: t("viewAll"), selectAll: t("selectAll"),
    selectedProducts: t("selectedProducts"), includeItem: t("includeItem"), excludeItem: t("excludeItem"), excludedFromTotal: t("excludedFromTotal"),
    removeTitle: t("removeTitle"), removeDescription: t("removeDescription"), removeConfirm: t("removeConfirm"), cancel: t("cancel"), product: t("product"),
    closeRemoveDialog: t("closeRemoveDialog"), moveToFavorites: t("moveToFavorites"), unavailable: t("unavailable"), priceChanged: t("priceChanged"),
    outOfStock: t("outOfStock"), insufficientStock: t("insufficientStock"),
  }), [t]);

  const formatCurrency = useMemo(() => (value) => new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US", {
    style: "currency", currency: summary.currency || "TRY", maximumFractionDigits: 0,
  }).format(Number(value || 0)), [locale, summary.currency]);

  const selectedItems = items.filter((item) => item.selected);
  const allSelected = items.length > 0 && selectedItems.length === items.length;
  const selectionPending = updateSelection.isPending;

  function updateQuantity(id, quantity) {
    updateItem.mutate({ itemId: id, quantity });
  }

  function toggleItem(id, selected) {
    updateSelection.mutate({ itemIds: [id], selected });
  }

  function toggleAll(selected) {
    updateSelection.mutate({ selected });
  }

  function removeItem() {
    if (!removeTarget) return;
    removeCartItem.mutate(removeTarget.id, {
      onSuccess: () => {
        setLiveMessage(t("removedSuccess"));
        setRemoveTarget(null);
      },
    });
  }

  async function moveToFavorites(item) {
    const productId = Number(item.productId);
    if (!Number.isInteger(productId) || productId < 1) return;
    try {
      await toggleFavorite.mutateAsync({ productId, isFavorite: false });
      await removeCartItem.mutateAsync(item.id);
      setLiveMessage(t("movedToFavorites"));
    } catch {
      setLiveMessage(t("actionError"));
    }
  }

  function applyCoupon(event) {
    event.preventDefault();
    const code = couponCode.trim();
    if (!code) return;
    applyCartCoupon.mutate(code, {
      onSuccess: () => setCouponMessage(t("promoSuccess")),
      onError: () => setCouponMessage(t("promoInvalid")),
    });
  }

  if (cartQuery.isPending) {
    return <div className="grid min-h-[28rem] place-items-center" role="status"><p className="flex items-center gap-2 text-sm text-muted-foreground"><RefreshCw className="size-4 animate-spin" />{t("loading")}</p></div>;
  }

  return (
    <div>
      <CheckoutSteps itemCount={Number(summary.selectedItemCount || 0)} labels={labels} />

      <div className="mt-[clamp(2rem,4vw,3.5rem)] flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm text-muted-foreground">{t("eyebrow")}</p><h1 className="mt-2 text-[clamp(2.5rem,5vw,5.25rem)] font-light leading-[0.92] tracking-[-0.045em]">{t("title")}</h1></div>
        <p className="max-w-md text-sm leading-6 text-muted-foreground">{t("description")}</p>
      </div>

      {cartQuery.isError ? (
        <div className="mt-8 flex flex-col items-start gap-4 border border-danger/25 bg-danger/5 p-5" role="alert">
          <p className="flex items-center gap-2 text-sm text-danger"><AlertCircle className="size-4" />{t("loadError")}</p>
          <button type="button" className="text-sm font-medium underline" onClick={() => cartQuery.refetch()}>{t("tryAgain")}</button>
        </div>
      ) : null}

      {items.length ? (
        <div className="mt-8 grid gap-x-[clamp(1.25rem,3vw,3rem)] gap-y-8 lg:grid-cols-[minmax(0,1fr)_clamp(19rem,24vw,23rem)]">
          <div className="min-w-0">
            <div className="flex min-h-12 flex-wrap items-center justify-between gap-3 border-t border-[#d8ddd7] px-1 py-2.5">
              <SiteCheckbox checked={allSelected} indeterminate={selectedItems.length > 0 && !allSelected} disabled={selectionPending} onCheckedChange={toggleAll} label={labels.selectAll} />
              <p className="text-xs text-[#68736f]">{selectedItems.length} / {items.length} {labels.selectedProducts}</p>
            </div>
            <div className="mb-4 flex min-h-12 items-center justify-center bg-[#e9ece6] px-4 text-center text-sm">{t("campaign")}</div>
            <div className="space-y-2">
              {items.map((item) => (
                <CartItem key={item.id} item={item} labels={labels} locale={locale} formatCurrency={formatCurrency} selected={item.selected}
                  pending={Boolean(item.pending || (updateItem.isPending && String(updateItem.variables?.itemId) === String(item.id)) || (removeCartItem.isPending && String(removeCartItem.variables) === String(item.id)) || (toggleFavorite.isPending && String(toggleFavorite.variables?.productId) === String(item.productId)) || selectionPending)}
                  onSelectedChange={toggleItem} onQuantityChange={updateQuantity} onRemove={setRemoveTarget} onMoveToFavorites={moveToFavorites} />
              ))}
            </div>
          </div>

          <OrderSummary totals={{ subtotal: summary.subtotalAmount, discount: summary.discountAmount, shipping: summary.shippingAmount, total: summary.totalAmount }} labels={labels}
            formatCurrency={formatCurrency} couponCode={couponCode} couponMessage={couponMessage} onCouponChange={setCouponCode} onCouponSubmit={applyCoupon}
            couponPending={applyCartCoupon.isPending} canCheckout={Number(summary.selectedItemCount || 0) > 0} />
          <div className="min-w-0 lg:col-start-1 lg:row-start-2"><CartRecommendations products={recommendations} labels={labels} formatCurrency={formatCurrency} /></div>
        </div>
      ) : !cartQuery.isError ? (
        <div className="mt-10 border border-border bg-[#f7f7f4] px-6 py-16 text-center sm:py-24">
          <ShoppingBag className="mx-auto size-8" strokeWidth={1.25} /><h2 className="mt-5 text-3xl">{t("emptyTitle")}</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">{t("emptyDescription")}</p>
          <Link href="/shop" className={cn(siteButtonVariants(), "mt-7")}>{t("startShopping")}</Link>
        </div>
      ) : null}

      <p className="sr-only" aria-live="polite">{liveMessage}</p>
      <RemoveItemDialog open={Boolean(removeTarget)} onOpenChange={(open) => !open && setRemoveTarget(null)} item={removeTarget} labels={labels} pending={removeCartItem.isPending} onConfirm={removeItem} />
    </div>
  );
}
