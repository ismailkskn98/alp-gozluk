'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Label } from '@/components/ui/label';
import { SiteButton } from '@/components/site/ui/button';
import { SiteInput } from '@/components/site/ui/input';
import { mergeGuestCommerceAfterAuthentication } from '@/features/commerce/merge-guest-commerce';
import { getPathname } from '@/i18n/navigation';

function getSchema(mode, tr) {
  const loginSchema = z.object({
    email: z.email(tr ? 'Geçerli bir e-posta adresi girin.' : 'Enter a valid email address.'),
    password: z.string().min(1, tr ? 'Şifrenizi girin.' : 'Enter your password.').max(128),
  });

  if (mode === 'login') return loginSchema;

  return loginSchema.extend({
    firstName: z.string().trim().min(2, tr ? 'En az 2 karakter girin.' : 'Enter at least 2 characters.').max(80),
    lastName: z.string().trim().min(2, tr ? 'En az 2 karakter girin.' : 'Enter at least 2 characters.').max(80),
    password: z.string()
      .min(10, tr ? 'Şifre en az 10 karakter olmalıdır.' : 'Password must be at least 10 characters.')
      .max(128)
      .regex(/[A-Za-z]/, tr ? 'Şifre bir harf içermelidir.' : 'Password must include a letter.')
      .regex(/\d/, tr ? 'Şifre bir rakam içermelidir.' : 'Password must include a number.'),
  });
}

export default function AuthForm({ mode = 'login', admin = false, locale = 'tr', onSuccess, redirectOnSuccess = true, redirectTo, idPrefix = '', appearance = 'default' }) {
  const router = useRouter();
  const tr = locale === 'tr';
  const [serverError, setServerError] = useState('');
  const schema = getSchema(mode, tr);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  async function onSubmit(values) {
    setServerError('');
    const response = await fetch(`/api/auth/${mode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    const payload = await response.json();
    if (!response.ok) {
      setServerError(payload.message || (tr ? 'İşlem tamamlanamadı.' : 'The request could not be completed.'));
      return;
    }
    onSuccess?.(payload.data?.user || null);
    void mergeGuestCommerceAfterAuthentication();
    if (redirectOnSuccess) {
      router.push(redirectTo || (admin ? '/admin' : getPathname({ href: '/account', locale })));
    }
    router.refresh();
  }

  const fields = mode === 'register'
    ? [['firstName', tr ? 'Ad' : 'First name', 'given-name'], ['lastName', tr ? 'Soyad' : 'Last name', 'family-name'], ['email', tr ? 'E-posta' : 'Email', 'email'], ['password', tr ? 'Şifre' : 'Password', 'new-password']]
    : [['email', tr ? 'E-posta' : 'Email', 'email'], ['password', tr ? 'Şifre' : 'Password', 'current-password']];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {fields.map(([name, label, autocomplete]) => (
        <div key={name} className="space-y-2">
          <Label htmlFor={idPrefix ? `${idPrefix}-${name}` : name}>{label}</Label>
          <SiteInput
            id={idPrefix ? `${idPrefix}-${name}` : name}
            type={name === 'password' ? 'password' : name === 'email' ? 'email' : 'text'}
            autoComplete={autocomplete}
            aria-invalid={Boolean(errors[name])}
            className={appearance === 'sheet' ? 'h-12' : undefined}
            {...register(name)}
          />
          {errors[name] ? <p className="text-sm text-danger">{errors[name].message}</p> : null}
        </div>
      ))}
      {serverError ? <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{serverError}</p> : null}
      <SiteButton type="submit" disabled={isSubmitting} size="wide">
        {isSubmitting ? (tr ? 'İşleniyor…' : 'Processing…') : mode === 'register' ? (tr ? 'Hesap oluştur' : 'Create account') : (tr ? 'Giriş yap' : 'Sign in')}
      </SiteButton>
    </form>
  );
}
