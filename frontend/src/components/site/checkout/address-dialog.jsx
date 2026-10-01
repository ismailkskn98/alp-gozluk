'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, ArrowLeft, Check, LoaderCircle, MapPin, Plus, X } from 'lucide-react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { SiteButton } from '@/components/site/ui/button';
import { SiteCheckbox } from '@/components/site/ui/checkbox';
import { siteInputClassName } from '@/components/site/ui/input';
import { SiteSelect } from '@/components/site/ui/select';
import { useDistricts, useNeighborhoods, useProvinces } from '@/features/checkout/locations';
import { isTurkishMobilePhone, normalizeTurkishPhone } from '@/features/checkout/phone';
import { cn } from '@/lib/utils';
import CheckoutFormField from './form-field';
import TurkeyPhoneInput from './turkey-phone-input';

const normalizeName = (value) => String(value || '').trim().toLocaleLowerCase('tr-TR');
const text = (minimum, maximum, message) => z.string().trim().min(minimum, message).max(maximum, message);
const inputClassName = cn(siteInputClassName, 'h-11 rounded-none text-sm');

function createSchema(t, requiresEmail) {
  return z.object({
    title: text(2, 80, t('validation.addressTitle')),
    firstName: text(2, 80, t('validation.name')),
    lastName: text(2, 80, t('validation.lastName')),
    email: requiresEmail ? z.email(t('validation.email')).max(190, t('validation.email')) : z.string(),
    phone: z.string().refine(isTurkishMobilePhone, t('validation.phone')),
    provinceId: z.string().min(1, t('validation.city')),
    city: text(2, 100, t('validation.city')),
    districtId: z.string().min(1, t('validation.district')),
    district: text(2, 100, t('validation.district')),
    neighborhoodId: z.string().min(1, t('validation.neighborhood')),
    neighborhood: text(2, 100, t('validation.neighborhood')),
    postalCode: z.string().trim().max(20, t('validation.postalCode')),
    addressLine: text(10, 2000, t('validation.address')),
  });
}

function addressDraft(address, profile, requiresEmail) {
  return {
    title: address?.title || '',
    firstName: address?.firstName || profile?.firstName || '',
    lastName: address?.lastName || profile?.lastName || '',
    email: requiresEmail ? address?.email || profile?.email || '' : '',
    phone: normalizeTurkishPhone(address?.phone || profile?.phone || ''),
    provinceId: '',
    city: address?.city || '',
    districtId: '',
    district: address?.district || '',
    neighborhoodId: '',
    neighborhood: address?.neighborhood || '',
    postalCode: address?.postalCode || '',
    addressLine: address?.addressLine || '',
  };
}

function publicAddress(values) {
  return {
    title: values.title.trim(),
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    email: values.email?.trim() || '',
    phone: normalizeTurkishPhone(values.phone),
    city: values.city.trim(),
    district: values.district.trim(),
    neighborhood: values.neighborhood.trim(),
    postalCode: values.postalCode.trim(),
    addressLine: values.addressLine.trim(),
  };
}

export default function AddressDialog({
  open,
  onOpenChange,
  mode = 'shipping',
  t,
  profile,
  addresses,
  value,
  authenticated,
  onApply,
  onAddressBookChange,
}) {
  const requiresEmail = mode === 'shipping';
  const schema = useMemo(() => createSchema(t, requiresEmail), [requiresEmail, t]);
  const matchingAddress = addresses.find((address) => (
    address.id && address.addressLine === value?.addressLine && address.district === value?.district
  ));
  const initialAddressId = matchingAddress?.id || addresses.find((address) => address.isDefault)?.id || addresses[0]?.id || null;
  const [view, setView] = useState(addresses.length ? 'list' : 'form');
  const [selectedAddressId, setSelectedAddressId] = useState(initialAddressId);
  const [saveToAddressBook, setSaveToAddressBook] = useState(authenticated && mode === 'shipping');
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const {
    control,
    formState: { errors },
    getValues,
    handleSubmit,
    reset,
    register,
    setValue,
  } = useForm({ resolver: zodResolver(schema), defaultValues: addressDraft(value, profile, requiresEmail) });
  const provinceId = useWatch({ control, name: 'provinceId' });
  const districtId = useWatch({ control, name: 'districtId' });
  const provincesQuery = useProvinces();
  const districtsQuery = useDistricts(provinceId);
  const neighborhoodsQuery = useNeighborhoods(districtId);

  useEffect(() => {
    if (!open || view !== 'form' || provinceId || !getValues('city') || !provincesQuery.data) return;
    const province = provincesQuery.data.find((item) => normalizeName(item.name) === normalizeName(getValues('city')));
    if (province) setValue('provinceId', String(province.id));
  }, [getValues, open, provinceId, provincesQuery.data, setValue, view]);

  useEffect(() => {
    if (!open || view !== 'form' || districtId || !getValues('district') || !districtsQuery.data) return;
    const district = districtsQuery.data.find((item) => normalizeName(item.name) === normalizeName(getValues('district')));
    if (district) setValue('districtId', String(district.id));
  }, [districtId, districtsQuery.data, getValues, open, setValue, view]);

  useEffect(() => {
    if (!open || view !== 'form' || getValues('neighborhoodId') || !getValues('neighborhood') || !neighborhoodsQuery.data) return;
    const neighborhood = neighborhoodsQuery.data.find((item) => normalizeName(item.name) === normalizeName(getValues('neighborhood')));
    if (neighborhood) setValue('neighborhoodId', String(neighborhood.id));
  }, [getValues, neighborhoodsQuery.data, open, setValue, view]);

  function editAddress(address) {
    reset(addressDraft({ ...address, email: value?.email }, profile, requiresEmail));
    setSubmitError('');
    setView('form');
  }

  function useSelectedAddress() {
    const selectedAddress = addresses.find((address) => String(address.id) === String(selectedAddressId));
    if (!selectedAddress) return;
    if (!selectedAddress.neighborhood) {
      editAddress(selectedAddress);
      return;
    }
    onApply(publicAddress({
      ...addressDraft(selectedAddress, profile, requiresEmail),
      email: value?.email || profile?.email || '',
    }));
    onOpenChange(false);
  }

  async function submit(values) {
    const nextAddress = publicAddress(values);
    setSaving(true);
    setSubmitError('');
    try {
      if (saveToAddressBook && authenticated && mode === 'shipping') {
        const response = await fetch('/api/account/addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...nextAddress, isDefault: addresses.length === 0 }),
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) throw new Error(payload?.message || t('addressDialog.saveError'));
        if (Array.isArray(payload?.data?.addresses)) onAddressBookChange(payload.data.addresses);
      }
      onApply(nextAddress);
      onOpenChange(false);
    } catch (error) {
      setSubmitError(error.message || t('addressDialog.saveError'));
    } finally {
      setSaving(false);
    }
  }

  const locationError = provincesQuery.isError || districtsQuery.isError || neighborhoodsQuery.isError;
  const provinceOptions = (provincesQuery.data || []).map((item) => ({ value: String(item.id), label: item.name }));
  const districtOptions = (districtsQuery.data || []).map((item) => ({ value: String(item.id), label: item.name }));
  const neighborhoodOptions = (neighborhoodsQuery.data || []).map((item) => ({ value: String(item.id), label: item.name }));

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[70] bg-[#172536]/45 backdrop-blur-[1px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in" />
        <DialogPrimitive.Content className="fixed inset-x-0 bottom-0 z-[71] grid max-h-[92svh] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-t-2xl border border-b-0 border-[#d8ddd7] bg-white text-[#172536] shadow-[0_-18px_55px_rgba(23,37,54,0.16)] outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[min(calc(100vw-2rem),39rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-none sm:border sm:shadow-[0_26px_80px_rgba(23,37,54,0.18)]">
          <header className="flex min-h-16 items-center justify-between border-b border-[#d8ddd7] px-5 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              {view === 'form' && addresses.length ? (
                <button type="button" className="grid size-8 shrink-0 place-items-center text-[#68736f] hover:text-[#172536]" onClick={() => setView('list')} aria-label={t('addressDialog.back')}>
                  <ArrowLeft className="size-4" />
                </button>
              ) : null}
              <div className="min-w-0">
                <DialogPrimitive.Title className="truncate text-base font-medium sm:text-lg">
                  {mode === 'shipping' ? t('addressDialog.deliveryTitle') : t('addressDialog.billingTitle')}
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="mt-0.5 truncate text-xs text-[#68736f]">
                  {view === 'list' ? t('addressDialog.selectDescription') : t('addressDialog.formDescription')}
                </DialogPrimitive.Description>
              </div>
            </div>
            <DialogPrimitive.Close className="grid size-10 shrink-0 place-items-center text-[#68736f] transition-colors hover:bg-[#f1f3f0] hover:text-[#172536]" aria-label={t('addressDialog.close')}>
              <X className="size-4" />
            </DialogPrimitive.Close>
          </header>

          <div className="overflow-y-auto overscroll-contain p-5 sm:p-6">
            {view === 'list' ? (
              <div>
                <div className="space-y-2">
                  {addresses.map((address) => {
                    const selected = String(address.id) === String(selectedAddressId);
                    return (
                      <button
                        key={address.id}
                        type="button"
                        onClick={() => setSelectedAddressId(address.id)}
                        className={cn(
                          'grid w-full grid-cols-[1.25rem_minmax(0,1fr)] gap-3 border p-4 text-left transition-colors',
                          selected ? 'border-[#172536] bg-[#f3f5f2]' : 'border-[#d8ddd7] bg-white hover:border-[#8b9691]',
                        )}
                      >
                        <span className={cn('mt-0.5 grid size-4 place-items-center rounded-full border', selected ? 'border-[#172536]' : 'border-[#aeb7b2]')}>
                          {selected ? <span className="size-2 rounded-full bg-[#172536]" /> : null}
                        </span>
                        <span className="min-w-0">
                          <span className="flex items-center justify-between gap-3">
                            <strong className="text-sm font-medium">{address.title}</strong>
                            {!address.neighborhood ? <span className="text-[11px] text-[#9a5b00]">{t('addressDialog.complete')}</span> : null}
                          </span>
                          <span className="mt-1 block text-xs leading-5 text-[#68736f]">
                            {address.firstName} {address.lastName} · {address.phone}<br />
                            {[address.neighborhood, address.district, address.city].filter(Boolean).join(' / ')}<br />
                            <span className="line-clamp-2">{address.addressLine}</span>
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                <button type="button" onClick={() => { reset(addressDraft(null, profile, requiresEmail)); setView('form'); }} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 border border-[#d8ddd7] text-sm font-medium transition-colors hover:border-[#172536]">
                  <Plus className="size-4" />{t('addressDialog.addNew')}
                </button>
              </div>
            ) : (
              <form id={`checkout-${mode}-address-form`} onSubmit={handleSubmit(submit)} noValidate>
                {!authenticated && mode === 'shipping' ? (
                  <div className="mb-5 flex gap-3 bg-[#f4f5f2] p-3 text-xs leading-5 text-[#52605a]">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                    <p>{t('addressDialog.guestNotice')}</p>
                  </div>
                ) : null}

                <div className="grid gap-4 sm:grid-cols-2">
                  {requiresEmail ? (
                    <CheckoutFormField htmlFor={`${mode}-email`} label={t('fields.email')} error={errors.email?.message} className="sm:col-span-2">
                      <input id={`${mode}-email`} type="email" inputMode="email" autoComplete="email" className={inputClassName} aria-invalid={Boolean(errors.email)} {...register('email')} />
                    </CheckoutFormField>
                  ) : null}
                  <CheckoutFormField htmlFor={`${mode}-first-name`} label={t('fields.firstName')} error={errors.firstName?.message}>
                    <input id={`${mode}-first-name`} autoComplete="given-name" className={inputClassName} aria-invalid={Boolean(errors.firstName)} {...register('firstName')} />
                  </CheckoutFormField>
                  <CheckoutFormField htmlFor={`${mode}-last-name`} label={t('fields.lastName')} error={errors.lastName?.message}>
                    <input id={`${mode}-last-name`} autoComplete="family-name" className={inputClassName} aria-invalid={Boolean(errors.lastName)} {...register('lastName')} />
                  </CheckoutFormField>
                  <CheckoutFormField htmlFor={`${mode}-phone`} label={t('fields.phone')} error={errors.phone?.message} className="sm:col-span-2">
                    <Controller name="phone" control={control} render={({ field }) => (
                      <TurkeyPhoneInput inputRef={field.ref} name={field.name} value={field.value} onChange={field.onChange} onBlur={field.onBlur} aria-invalid={Boolean(errors.phone)} />
                    )} />
                  </CheckoutFormField>
                  <CheckoutFormField htmlFor={`${mode}-city`} label={t('fields.city')} error={errors.city?.message}>
                    <Controller name="provinceId" control={control} render={({ field }) => (
                      <SiteSelect
                        id={`${mode}-city`}
                        value={field.value}
                        onValueChange={(nextValue) => {
                          field.onChange(nextValue);
                          const province = provincesQuery.data?.find((item) => String(item.id) === nextValue);
                          setValue('city', province?.name || '', { shouldValidate: true });
                          setValue('districtId', '');
                          setValue('district', '');
                          setValue('neighborhoodId', '');
                          setValue('neighborhood', '');
                          setValue('postalCode', '');
                        }}
                        options={provinceOptions}
                        placeholder={provincesQuery.isPending ? t('addressDialog.loading') : t('addressDialog.select')}
                        disabled={provincesQuery.isPending}
                        triggerClassName="rounded-none"
                        aria-invalid={Boolean(errors.provinceId || errors.city)}
                      />
                    )} />
                  </CheckoutFormField>
                  <CheckoutFormField htmlFor={`${mode}-district`} label={t('fields.district')} error={errors.district?.message}>
                    <Controller name="districtId" control={control} render={({ field }) => (
                      <SiteSelect
                        id={`${mode}-district`}
                        value={field.value}
                        onValueChange={(nextValue) => {
                          field.onChange(nextValue);
                          const district = districtsQuery.data?.find((item) => String(item.id) === nextValue);
                          setValue('district', district?.name || '', { shouldValidate: true });
                          setValue('neighborhoodId', '');
                          setValue('neighborhood', '');
                          setValue('postalCode', '');
                        }}
                        options={districtOptions}
                        placeholder={districtsQuery.isFetching ? t('addressDialog.loading') : t('addressDialog.select')}
                        disabled={!provinceId || districtsQuery.isFetching}
                        triggerClassName="rounded-none"
                        aria-invalid={Boolean(errors.districtId || errors.district)}
                      />
                    )} />
                  </CheckoutFormField>
                  <CheckoutFormField htmlFor={`${mode}-neighborhood`} label={t('fields.neighborhood')} error={errors.neighborhood?.message} className="sm:col-span-2">
                    <Controller name="neighborhoodId" control={control} render={({ field }) => (
                      <SiteSelect
                        id={`${mode}-neighborhood`}
                        value={field.value}
                        onValueChange={(nextValue) => {
                          field.onChange(nextValue);
                          const neighborhood = neighborhoodsQuery.data?.find((item) => String(item.id) === nextValue);
                          setValue('neighborhood', neighborhood?.name || '', { shouldValidate: true });
                          setValue('postalCode', neighborhood?.postalCode || '');
                        }}
                        options={neighborhoodOptions}
                        placeholder={neighborhoodsQuery.isFetching ? t('addressDialog.loading') : t('addressDialog.select')}
                        disabled={!districtId || neighborhoodsQuery.isFetching}
                        triggerClassName="rounded-none"
                        aria-invalid={Boolean(errors.neighborhoodId || errors.neighborhood)}
                      />
                    )} />
                  </CheckoutFormField>
                  {locationError ? <p className="sm:col-span-2 text-xs text-[#a53e3e]">{t('addressDialog.locationError')}</p> : null}
                  <div className="sm:col-span-2 flex gap-3 bg-[#fff5ed] p-3 text-xs leading-5 text-[#7c4a20]">
                    <MapPin className="mt-0.5 size-4 shrink-0" />
                    <p>{t('addressDialog.addressHint')}</p>
                  </div>
                  <CheckoutFormField htmlFor={`${mode}-address-line`} label={t('fields.address')} error={errors.addressLine?.message} className="sm:col-span-2">
                    <textarea id={`${mode}-address-line`} autoComplete="street-address" className={cn(inputClassName, 'min-h-20 resize-y py-3')} aria-invalid={Boolean(errors.addressLine)} placeholder={t('addressDialog.addressPlaceholder')} {...register('addressLine')} />
                  </CheckoutFormField>
                  <CheckoutFormField htmlFor={`${mode}-address-title`} label={t('fields.addressTitle')} error={errors.title?.message} className="sm:col-span-2">
                    <input id={`${mode}-address-title`} className={inputClassName} aria-invalid={Boolean(errors.title)} placeholder={t('addressDialog.titlePlaceholder')} {...register('title')} />
                  </CheckoutFormField>
                </div>

                {authenticated && mode === 'shipping' ? (
                  <div className="mt-5 border-t border-[#d8ddd7] pt-4">
                    <SiteCheckbox checked={saveToAddressBook} onCheckedChange={setSaveToAddressBook} label={t('addressDialog.saveToAccount')} />
                  </div>
                ) : null}
                {submitError ? <p className="mt-4 border border-[#d9a8a8] bg-[#fff6f6] p-3 text-xs text-[#9f3434]" role="alert">{submitError}</p> : null}
              </form>
            )}
          </div>

          <footer className="border-t border-[#d8ddd7] bg-white p-4 sm:px-6">
            {view === 'list' ? (
              <SiteButton type="button" size="wide" className="rounded-none" disabled={!selectedAddressId} onClick={useSelectedAddress}>
                <Check className="size-4" />{t('addressDialog.useAddress')}
              </SiteButton>
            ) : (
              <SiteButton type="submit" form={`checkout-${mode}-address-form`} size="wide" className="rounded-none" disabled={saving || locationError}>
                {saving ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}
                {t('addressDialog.save')}
              </SiteButton>
            )}
          </footer>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
