'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const loginSchema = z.object({
  email: z.email('Geçerli bir e-posta adresi girin.'),
  password: z.string().min(1, 'Şifrenizi girin.').max(128),
});

const registerSchema = loginSchema.extend({
  firstName: z.string().trim().min(2, 'En az 2 karakter girin.').max(80),
  lastName: z.string().trim().min(2, 'En az 2 karakter girin.').max(80),
  password: z.string().min(10, 'Şifre en az 10 karakter olmalıdır.').max(128).regex(/[A-Za-z]/, 'Şifre bir harf içermelidir.').regex(/\d/, 'Şifre bir rakam içermelidir.'),
});

export default function AuthForm({ mode = 'login', admin = false, locale = 'tr' }) {
  const router = useRouter();
  const tr = locale === 'tr';
  const [serverError, setServerError] = useState('');
  const schema = mode === 'register' ? registerSchema : loginSchema;
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
    router.push(admin ? '/admin' : `/${locale}/account`);
    router.refresh();
  }

  const fields = mode === 'register'
    ? [['firstName', tr ? 'Ad' : 'First name', 'given-name'], ['lastName', tr ? 'Soyad' : 'Last name', 'family-name'], ['email', tr ? 'E-posta' : 'Email', 'email'], ['password', tr ? 'Şifre' : 'Password', 'new-password']]
    : [['email', tr ? 'E-posta' : 'Email', 'email'], ['password', tr ? 'Şifre' : 'Password', 'current-password']];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {fields.map(([name, label, autocomplete]) => (
        <div key={name} className="space-y-2">
          <Label htmlFor={name}>{label}</Label>
          <Input id={name} type={name === 'password' ? 'password' : name === 'email' ? 'email' : 'text'} autoComplete={autocomplete} aria-invalid={Boolean(errors[name])} {...register(name)} />
          {errors[name] ? <p className="text-sm text-danger">{errors[name].message}</p> : null}
        </div>
      ))}
      {serverError ? <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{serverError}</p> : null}
      <button type="submit" disabled={isSubmitting} className="h-11 w-full rounded-md bg-primary px-5 text-sm font-semibold text-white hover:bg-[#124887] disabled:opacity-60">
        {isSubmitting ? (tr ? 'İşleniyor…' : 'Processing…') : mode === 'register' ? (tr ? 'Hesap oluştur' : 'Create account') : (tr ? 'Giriş yap' : 'Sign in')}
      </button>
    </form>
  );
}
