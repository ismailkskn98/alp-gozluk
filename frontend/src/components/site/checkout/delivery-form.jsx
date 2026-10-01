'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Check, LoaderCircle, MapPin, PencilLine, Truck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { SiteButton } from '@/components/site/ui/button';
import { SiteCheckbox } from '@/components/site/ui/checkbox';
import { siteInputClassName } from '@/components/site/ui/input';
import { isTurkishMobilePhone, normalizeTurkishPhone } from '@/features/checkout/phone';
import { cn } from '@/lib/utils';
import AddressDialog from './address-dialog';
import AddressSummaryCard from './address-summary-card';
import CheckoutFormField from './form-field';

const text = (minimum, maximum, message) => z.string().trim().min(minimum, message).max(maximum, message);

function createSchema(t) {
  const addressFields = {
    firstName: text(2, 80, t('validation.name')),
    lastName: text(2, 80, t('validation.lastName')),
    phone: z.string().refine(isTurkishMobilePhone, t('validation.phone')),
    city: text(2, 100, t('validation.city')),
    district: text(2, 100, t('validation.district')),
    neighborhood: text(2, 100, t('validation.neighborhood')),
    postalCode: z.string().trim().max(20, t('validation.postalCode')),
    addressLine: text(10, 2000, t('validation.address')),
  };
  return z.object({
    title: z.string().trim().max(80),
    ...addressFields,
    email: z.email(t('validation.email')).max(190, t('validation.email')),
    billingSameAsShipping: z.boolean(),
    billingTitle: z.string().trim().max(80),
    billingFirstName: z.string().trim(),
    billingLastName: z.string().trim(),
    billingPhone: z.string().trim(),
    billingCity: z.string().trim(),
    billingDistrict: z.string().trim(),
    billingNeighborhood: z.string().trim(),
    billingPostalCode: z.string().trim(),
    billingAddressLine: z.string().trim(),
    notes: z.string().trim().max(1000, t('validation.notes')),
  }).superRefine((values, context) => {
    if (values.billingSameAsShipping) return;
    const requiredFields = [
      ['billingFirstName', values.billingFirstName, 2, 80, t('validation.name')],
      ['billingLastName', values.billingLastName, 2, 80, t('validation.lastName')],
      ['billingCity', values.billingCity, 2, 100, t('validation.city')],
      ['billingDistrict', values.billingDistrict, 2, 100, t('validation.district')],
      ['billingNeighborhood', values.billingNeighborhood, 2, 100, t('validation.neighborhood')],
      ['billingAddressLine', values.billingAddressLine, 10, 2000, t('validation.address')],
    ];
    requiredFields.forEach(([field, value, minimum, maximum, message]) => {
      if (value.length < minimum || value.length > maximum) context.addIssue({ code: 'custom', path: [field], message });
    });
    if (!isTurkishMobilePhone(values.billingPhone)) {
      context.addIssue({ code: 'custom', path: ['billingPhone'], message: t('validation.phone') });
    }
    if (values.billingPostalCode.length > 20) {
      context.addIssue({ code: 'custom', path: ['billingPostalCode'], message: t('validation.postalCode') });
    }
  });
}

function defaultValues(profile, address) {
  return {
    title: address?.title || '',
    firstName: address?.firstName || profile?.firstName || '',
    lastName: address?.lastName || profile?.lastName || '',
    email: profile?.email || '',
    phone: normalizeTurkishPhone(address?.phone || profile?.phone || ''),
    city: address?.city || '',
    district: address?.district || '',
    neighborhood: address?.neighborhood || '',
    postalCode: address?.postalCode || '',
    addressLine: address?.addressLine || '',
    billingSameAsShipping: true,
    billingTitle: '',
    billingFirstName: '',
    billingLastName: '',
    billingPhone: '',
    billingCity: '',
    billingDistrict: '',
    billingNeighborhood: '',
    billingPostalCode: '',
    billingAddressLine: '',
    notes: '',
  };
}

function shippingValue(values) {
  return {
    title: values.title,
    firstName: values.firstName,
    lastName: values.lastName,
    email: values.email,
    phone: values.phone,
    city: values.city,
    district: values.district,
    neighborhood: values.neighborhood,
    postalCode: values.postalCode,
    addressLine: values.addressLine,
  };
}

function billingValue(values) {
  return {
    title: values.billingTitle,
    firstName: values.billingFirstName,
    lastName: values.billingLastName,
    phone: values.billingPhone,
    city: values.billingCity,
    district: values.billingDistrict,
    neighborhood: values.billingNeighborhood,
    postalCode: values.billingPostalCode,
    addressLine: values.billingAddressLine,
  };
}

const noteInputClassName = cn(siteInputClassName, 'min-h-20 resize-y rounded-none py-3 text-sm');

export default function DeliveryForm({
  t,
  profile,
  addresses,
  order,
  preparing,
  changing,
  settings,
  onConfirm,
  onChangeOrder,
}) {
  const preferredAddress = addresses.find((address) => address.isDefault) || addresses[0];
  const schema = useMemo(() => createSchema(t), [t]);
  const [availableAddresses, setAvailableAddresses] = useState(addresses);
  const [shippingDialogOpen, setShippingDialogOpen] = useState(false);
  const [billingDialogOpen, setBillingDialogOpen] = useState(false);
  const [serverError, setServerError] = useState('');
  const {
    control,
    formState: { errors },
    getValues,
    handleSubmit,
    register,
    reset,
  } = useForm({ resolver: zodResolver(schema), defaultValues: defaultValues(profile, preferredAddress) });
  const values = useWatch({ control });
  const billingSameAsShipping = values.billingSameAsShipping;
  const shipping = useMemo(() => shippingValue(values), [values]);
  const billing = useMemo(() => billingValue(values), [values]);
  const authenticated = Boolean(profile?.id);

  function applyShipping(address) {
    reset({ ...getValues(), ...address });
  }

  function applyBilling(address) {
    reset({
      ...getValues(),
      billingTitle: address.title,
      billingFirstName: address.firstName,
      billingLastName: address.lastName,
      billingPhone: address.phone,
      billingCity: address.city,
      billingDistrict: address.district,
      billingNeighborhood: address.neighborhood,
      billingPostalCode: address.postalCode,
      billingAddressLine: address.addressLine,
    });
  }

  async function submit(nextValues) {
    setServerError('');
    try {
      await onConfirm(nextValues);
    } catch (error) {
      setServerError(error.message || t('errors.prepare'));
    }
  }

  function invalidSubmit(invalidFields) {
    const billingInvalid = Object.keys(invalidFields).some((field) => field.startsWith('billing'));
    if (!billingSameAsShipping && billingInvalid) setBillingDialogOpen(true);
    else setShippingDialogOpen(true);
  }

  if (order) {
    const confirmedShipping = order.addresses?.find((address) => address.type === 'shipping');
    return (
      <section className="border border-[#d8ddd7] bg-white p-4 sm:p-5" aria-labelledby="delivery-title">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.13em] text-[#68736f]">{t('delivery.confirmed')}</p>
            <h2 id="delivery-title" className="mt-1 text-base font-medium text-[#172536]">{t('delivery.title')}</h2>
          </div>
          <SiteButton type="button" variant="secondary" size="compact" className="min-h-9 rounded-none px-3 text-xs" disabled={changing} onClick={onChangeOrder}>
            {changing ? <LoaderCircle className="animate-spin" /> : <PencilLine />}
            {t('delivery.change')}
          </SiteButton>
        </div>
        <div className="mt-4 grid gap-4 border-t border-[#d8ddd7] pt-4 sm:grid-cols-2">
          <div className="flex gap-3">
            <MapPin className="mt-0.5 size-4 shrink-0 text-[#172536]" strokeWidth={1.5} />
            <address className="text-xs not-italic leading-5 text-[#52605a] sm:text-[0.8125rem]">
              <strong className="block font-medium text-[#172536]">{confirmedShipping?.firstName} {confirmedShipping?.lastName}</strong>
              {confirmedShipping?.addressLine}<br />
              {confirmedShipping?.neighborhood} · {confirmedShipping?.district} / {confirmedShipping?.city}<br />
              {confirmedShipping?.phone}
            </address>
          </div>
          <div className="flex gap-3">
            <Truck className="mt-0.5 size-4 shrink-0 text-[#172536]" strokeWidth={1.5} />
            <div className="text-xs leading-5 text-[#52605a] sm:text-[0.8125rem]">
              <strong className="block font-medium text-[#172536]">{order.shippingMethod?.name || t('shipping.standard')}</strong>
              {t('shipping.dispatch', { min: settings.dispatchMinDays, max: settings.dispatchMaxDays })}<br />
              {t('shipping.returnWindow', { days: settings.returnWindowDays })}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <form id="checkout-delivery-form" onSubmit={handleSubmit(submit, invalidSubmit)} noValidate>
      <div className="space-y-3">
        <AddressSummaryCard
          eyebrow={t('delivery.eyebrow')}
          title={t('delivery.title')}
          address={shipping}
          emptyText={t('delivery.empty')}
          actionLabel={shipping.addressLine ? t('delivery.change') : t('delivery.add')}
          onAction={() => setShippingDialogOpen(true)}
        />

        <section className="border border-[#d8ddd7] bg-white p-4 sm:p-5">
          <Controller name="billingSameAsShipping" control={control} render={({ field }) => (
            <SiteCheckbox checked={field.value} onCheckedChange={field.onChange} label={t('billing.same')} />
          )} />
        </section>

        {!billingSameAsShipping ? (
          <AddressSummaryCard
            eyebrow={t('billing.eyebrow')}
            title={t('billing.title')}
            address={billing}
            emptyText={t('billing.empty')}
            actionLabel={billing.addressLine ? t('delivery.change') : t('delivery.add')}
            onAction={() => setBillingDialogOpen(true)}
          />
        ) : null}

        <section className="border border-[#d8ddd7] bg-white p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border border-[#172536]"><span className="size-2 rounded-full bg-[#172536]" /></span>
            <Truck className="mt-0.5 size-4 shrink-0 text-[#172536]" strokeWidth={1.5} />
            <div className="min-w-0 flex-1 text-xs leading-5">
              <strong className="font-medium text-[#172536]">{t('shipping.standard')}</strong>
              <p className="text-[#68736f]">{t('shipping.dispatch', { min: settings.dispatchMinDays, max: settings.dispatchMaxDays })}</p>
            </div>
            <span className="text-xs font-medium text-[#356a50]">{t('summary.free')}</span>
          </div>
          <details className="group mt-4 border-t border-[#e1e5e2] pt-4">
            <summary className="cursor-pointer list-none text-xs font-medium text-[#263630] marker:content-none">{t('delivery.addNote')}</summary>
            <CheckoutFormField htmlFor="order-notes" label={t('delivery.noteLabel')} hint={t('fields.optional')} error={errors.notes?.message} className="mt-4">
              <textarea id="order-notes" className={noteInputClassName} {...register('notes')} />
            </CheckoutFormField>
          </details>
        </section>

        {serverError ? <p className="border border-[#d9a8a8] bg-[#fff6f6] p-3 text-xs text-[#9f3434]" role="alert">{serverError}</p> : null}
        <SiteButton type="submit" size="wide" className="rounded-none lg:hidden" disabled={preparing}>
          {preparing ? <LoaderCircle className="animate-spin" /> : <Check />}
          {t('actions.confirmDelivery')}
        </SiteButton>
      </div>

      {shippingDialogOpen ? (
        <AddressDialog
          open
          onOpenChange={setShippingDialogOpen}
          mode="shipping"
          t={t}
          profile={profile}
          addresses={availableAddresses}
          value={shipping}
          authenticated={authenticated}
          onApply={applyShipping}
          onAddressBookChange={setAvailableAddresses}
        />
      ) : null}
      {billingDialogOpen ? (
        <AddressDialog
          open
          onOpenChange={setBillingDialogOpen}
          mode="billing"
          t={t}
          profile={profile}
          addresses={availableAddresses}
          value={billing}
          authenticated={authenticated}
          onApply={applyBilling}
          onAddressBookChange={setAvailableAddresses}
        />
      ) : null}
    </form>
  );
}
