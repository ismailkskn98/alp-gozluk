'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CreditCard, LoaderCircle, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { Link, useRouter } from '@/i18n/navigation';
import { fetchInstallments, initializeThreeDs } from '@/features/checkout/api';
import { SiteCheckbox } from '@/components/site/ui/checkbox';
import { siteInputClassName } from '@/components/site/ui/input';
import { cn } from '@/lib/utils';
import CheckoutFormField from './form-field';

const digitsOnly = (value) => String(value || '').replace(/\D/g, '');

function passesLuhn(value) {
  const cardNumber = digitsOnly(value);
  let total = 0;
  let doubleDigit = false;
  for (let index = cardNumber.length - 1; index >= 0; index -= 1) {
    let digit = Number(cardNumber[index]);
    if (doubleDigit) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    total += digit;
    doubleDigit = !doubleDigit;
  }
  return total > 0 && total % 10 === 0;
}

function formatCardNumber(value) {
  return digitsOnly(value).slice(0, 19).replace(/(.{4})/g, '$1 ').trim();
}

function createSchema(t) {
  return z.object({
    cardNumber: z.string().transform(digitsOnly).refine(
      (value) => /^\d{13,19}$/.test(value) && passesLuhn(value),
      t('validation.cardNumber'),
    ),
    cardHolderName: z.string().trim().min(2, t('validation.cardHolder')).max(100, t('validation.cardHolder')),
    expireMonth: z.string().regex(/^(0[1-9]|1[0-2])$/, t('validation.expiry')),
    expireYear: z.string().regex(/^\d{4}$/, t('validation.expiry')),
    cvc: z.string().transform(digitsOnly).refine((value) => /^\d{3,4}$/.test(value), t('validation.cvc')),
    acceptedAgreements: z.boolean().refine(Boolean, t('validation.agreements')),
  }).superRefine((values, context) => {
    if (!/^\d{4}$/.test(values.expireYear) || !/^(0[1-9]|1[0-2])$/.test(values.expireMonth)) return;
    const now = new Date();
    const expiry = new Date(Number(values.expireYear), Number(values.expireMonth), 1);
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    if (expiry <= currentMonth) {
      context.addIssue({ code: 'custom', path: ['expireMonth'], message: t('validation.expiry') });
    }
  });
}

function createIdempotencyKey() {
  return `payment:${crypto.randomUUID()}`;
}

const inputClassName = cn(siteInputClassName, 'h-11 rounded-none text-sm');

export default function PaymentCardForm({ order, locale, t, formatCurrency, onBusyChange, onAmountChange }) {
  const schema = useMemo(() => createSchema(t), [t]);
  const router = useRouter();
  const [paymentIdempotencyKey] = useState(createIdempotencyKey);
  const [installmentLookup, setInstallmentLookup] = useState({
    binNumber: '', status: 'idle', options: [], card: null,
  });
  const [selectedInstallment, setSelectedInstallment] = useState(1);
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      cardNumber: '',
      cardHolderName: '',
      expireMonth: '',
      expireYear: '',
      cvc: '',
      acceptedAgreements: false,
    },
  });
  const cardNumber = useWatch({ control, name: 'cardNumber' });
  const binNumber = digitsOnly(cardNumber).slice(0, 8);
  const fallbackInstallment = { installment: 1, installmentPrice: order.totalAmount, totalPrice: order.totalAmount };
  const lookupMatches = installmentLookup.binNumber === binNumber;
  const installments = lookupMatches && installmentLookup.status === 'success'
    ? installmentLookup.options
    : [fallbackInstallment];
  const selectedInstallmentValue = installments.some((option) => option.installment === selectedInstallment)
    ? selectedInstallment
    : 1;
  const lookupStatus = binNumber.length === 8
    ? (lookupMatches ? installmentLookup.status : 'loading')
    : 'idle';
  const cardSummary = lookupMatches ? installmentLookup.card : null;

  useEffect(() => {
    onBusyChange(submitting);
  }, [onBusyChange, submitting]);

  useEffect(() => {
    if (binNumber.length !== 8) return undefined;

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setInstallmentLookup({ binNumber, status: 'loading', options: [], card: null });
      try {
        const result = await fetchInstallments({ orderNumber: order.orderNumber, binNumber, locale }, { signal: controller.signal });
        if (!result?.options?.length) throw new Error(t('payment.installmentError'));
        setInstallmentLookup({ binNumber, status: 'success', options: result.options, card: result.card });
      } catch (error) {
        if (error.name === 'AbortError') return;
        setInstallmentLookup({ binNumber, status: 'error', options: [], card: null });
      }
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [binNumber, locale, order.orderNumber, t]);

  async function submit(values) {
    if (submitting) return;
    setSubmitting(true);
    setServerError('');
    try {
      const result = await initializeThreeDs({
        orderNumber: order.orderNumber,
        locale,
        installment: selectedInstallmentValue,
        card: {
          cardNumber: digitsOnly(values.cardNumber),
          cardHolderName: values.cardHolderName.trim(),
          expireMonth: values.expireMonth,
          expireYear: values.expireYear,
          cvc: digitsOnly(values.cvc),
        },
      }, paymentIdempotencyKey);

      if (result?.threeDsPageUrl) {
        const destination = new URL(result.threeDsPageUrl);
        if (!['https:', 'http:'].includes(destination.protocol)) throw new Error(t('errors.payment'));
        window.location.assign(destination.toString());
        return;
      }
      if (result?.paymentAttemptId && result.status === 'paid') {
        router.push(`/checkout/result?paymentAttemptId=${encodeURIComponent(result.paymentAttemptId)}`);
        return;
      }
      throw new Error(t('errors.payment'));
    } catch (error) {
      setServerError(error.message || t('errors.payment'));
      setSubmitting(false);
    }
  }

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 16 }, (_, index) => String(currentYear + index));

  return (
    <form id="checkout-payment-form" onSubmit={handleSubmit(submit)} noValidate autoComplete="on">
      <section className="border border-[#d8ddd7] bg-white p-4 sm:p-5" aria-labelledby="payment-title">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.13em] text-[#68736f]">{t('payment.eyebrow')}</p>
            <h2 id="payment-title" tabIndex={-1} className="mt-1 text-base font-medium text-[#172536] outline-none">{t('payment.title')}</h2>
            <p className="mt-1.5 max-w-2xl text-xs leading-5 text-[#68736f]">{t('payment.description')}</p>
          </div>
          <span className="grid size-10 shrink-0 place-items-center border border-[#d8ddd7] bg-[#f7f8f5]">
            <CreditCard className="size-4" strokeWidth={1.5} />
          </span>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <CheckoutFormField htmlFor="card-number" label={t('fields.cardNumber')} error={errors.cardNumber?.message} className="sm:col-span-2">
            <div className="relative">
              <Controller name="cardNumber" control={control} render={({ field }) => (
                <input
                  id="card-number"
                  ref={field.ref}
                  name={field.name}
                  value={formatCardNumber(field.value)}
                  onBlur={field.onBlur}
                  onChange={(event) => {
                    field.onChange(digitsOnly(event.target.value).slice(0, 19));
                    setSelectedInstallment(1);
                    onAmountChange(order.totalAmount);
                  }}
                  inputMode="numeric"
                  autoComplete="cc-number"
                  maxLength={23}
                  aria-invalid={Boolean(errors.cardNumber)}
                  aria-describedby={errors.cardNumber ? 'card-number-error' : undefined}
                  className={cn(inputClassName, 'pr-12 tracking-[0.08em]')}
                  placeholder="0000 0000 0000 0000"
                />
              )} />
              <CreditCard className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-[#7b8580]" />
            </div>
          </CheckoutFormField>
          <CheckoutFormField htmlFor="card-holder" label={t('fields.cardHolder')} error={errors.cardHolderName?.message} className="sm:col-span-2">
            <input id="card-holder" autoComplete="cc-name" aria-invalid={Boolean(errors.cardHolderName)} aria-describedby={errors.cardHolderName ? 'card-holder-error' : undefined} className={inputClassName} {...register('cardHolderName')} />
          </CheckoutFormField>
          <div className="grid grid-cols-2 gap-3">
            <CheckoutFormField htmlFor="expire-month" label={t('fields.expiry')} error={errors.expireMonth?.message}>
              <select id="expire-month" autoComplete="cc-exp-month" aria-invalid={Boolean(errors.expireMonth)} aria-describedby={errors.expireMonth ? 'expire-month-error' : undefined} className={inputClassName} {...register('expireMonth')}>
                <option value="">{t('fields.month')}</option>
                {Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0')).map((month) => <option key={month} value={month}>{month}</option>)}
              </select>
            </CheckoutFormField>
            <CheckoutFormField htmlFor="expire-year" label=" " error={errors.expireYear?.message}>
              <select id="expire-year" autoComplete="cc-exp-year" aria-invalid={Boolean(errors.expireYear)} aria-describedby={errors.expireYear ? 'expire-year-error' : undefined} className={inputClassName} {...register('expireYear')}>
                <option value="">{t('fields.year')}</option>
                {yearOptions.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
            </CheckoutFormField>
          </div>
          <CheckoutFormField htmlFor="cvc" label={t('fields.cvc')} hint={t('fields.cvcHint')} error={errors.cvc?.message}>
            <input id="cvc" type="password" inputMode="numeric" autoComplete="cc-csc" maxLength={4} aria-invalid={Boolean(errors.cvc)} aria-describedby={errors.cvc ? 'cvc-error' : undefined} className={inputClassName} {...register('cvc', { setValueAs: digitsOnly })} />
          </CheckoutFormField>
        </div>

        <div className="mt-5 border-t border-[#d8ddd7] pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-medium text-[#263630]">{t('payment.installments')}</h3>
            {lookupStatus === 'loading' ? <span className="flex items-center gap-1.5 text-xs text-[#68736f]"><LoaderCircle className="size-3.5 animate-spin" />{t('payment.installmentLoading')}</span> : null}
            {cardSummary?.bankName ? <span className="text-xs text-[#68736f]">{cardSummary.bankName} · {cardSummary.association}</span> : null}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {installments.map((option) => (
              <label key={option.installment} className={cn('flex min-h-14 cursor-pointer items-center gap-3 border p-3 transition-colors', selectedInstallmentValue === option.installment ? 'border-[#172536] bg-[#f1f3f0]' : 'border-[#d8ddd7] bg-white hover:border-[#8b9691]')}>
                <input type="radio" name="installment" value={option.installment} checked={selectedInstallmentValue === option.installment} onChange={() => { setSelectedInstallment(option.installment); onAmountChange(option.totalPrice); }} className="size-4 accent-[#172536]" />
                <span className="min-w-0 flex-1 text-sm">
                  <span className="block font-medium text-[#172536]">{option.installment === 1 ? t('payment.singlePayment') : t('payment.installmentCount', { count: option.installment })}</span>
                  <span className="mt-0.5 block text-xs text-[#68736f]">{option.installment > 1 ? `${option.installment} × ${formatCurrency(option.installmentPrice)}` : t('payment.noInterest')}</span>
                </span>
                <strong className="text-sm font-medium text-[#172536]">{formatCurrency(option.totalPrice)}</strong>
              </label>
            ))}
          </div>
          {lookupStatus === 'error' ? <p className="mt-2 text-xs text-[#9a5b00]">{t('payment.installmentError')}</p> : null}
        </div>

        <div className="mt-5 border-t border-[#d8ddd7] pt-4">
          <Controller name="acceptedAgreements" control={control} render={({ field }) => (
            <SiteCheckbox
              checked={field.value}
              onCheckedChange={field.onChange}
              aria-invalid={Boolean(errors.acceptedAgreements)}
              label={(
                <span className="text-xs leading-5 text-[#52605a]">
                  <Link href="/legal/pre-contract-information" target="_blank" className="font-medium text-[#172536] underline underline-offset-2">{t('agreements.preInformation')}</Link>
                  {' '}{t('agreements.and')}{' '}
                  <Link href="/legal/distance-sales-agreement" target="_blank" className="font-medium text-[#172536] underline underline-offset-2">{t('agreements.distanceSales')}</Link>
                  {' '}{t('agreements.accept')}
                </span>
              )}
            />
          )} />
          {errors.acceptedAgreements ? <p className="mt-1 text-xs text-[#a53e3e]" role="alert">{errors.acceptedAgreements.message}</p> : null}
        </div>

        <div className="mt-4 flex items-start gap-3 bg-[#f4f5f2] p-3 text-xs leading-5 text-[#68736f]">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#356a50]" />
          <p>{t('payment.securityNote')}</p>
        </div>
        {serverError ? <p className="mt-5 border border-[#d9a8a8] bg-[#fff6f6] p-3 text-sm text-[#9f3434]" role="alert">{serverError}</p> : null}
        <button type="submit" className="sr-only">{t('actions.pay')}</button>
        <p className="mt-4 flex items-center justify-center gap-2 text-xs text-[#68736f] lg:hidden">
          <LockKeyhole className="size-3.5" />{t('payment.secureThreeDs')}
        </p>
      </section>
    </form>
  );
}
