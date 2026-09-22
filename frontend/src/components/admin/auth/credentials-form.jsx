'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { AdminButton } from '@/components/admin/ui/button';
import { adminInputClass, AdminFormField } from '@/components/admin/ui/form-field';
import AdminLoader from '@/components/admin/ui/loader';

const schema = z.object({
  email: z.email('Geçerli bir e-posta adresi girin.'),
  password: z.string().min(1, 'Şifrenizi girin.').max(128),
});

export default function CredentialsForm({ onSubmit, serverError }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <AdminFormField htmlFor="admin-email" label="E-posta" error={errors.email?.message} required><input id="admin-email" className={adminInputClass} type="email" autoComplete="username" aria-invalid={Boolean(errors.email)} {...register('email')} /></AdminFormField>
      <AdminFormField htmlFor="admin-password" label="Şifre" error={errors.password?.message} required><input id="admin-password" className={adminInputClass} type="password" autoComplete="current-password" aria-invalid={Boolean(errors.password)} {...register('password')} /></AdminFormField>
      <div className="flex justify-end"><Link href="/admin/forgot-password" className="text-xs font-medium text-muted-foreground hover:text-primary">Şifremi unuttum</Link></div>
      {serverError ? <p role="alert" className="rounded-xl border border-danger/20 bg-danger/10 p-3 text-sm text-danger">{serverError}</p> : null}
      <AdminButton type="submit" disabled={isSubmitting} className="min-h-12 w-full">{isSubmitting ? <AdminLoader label="Giriş yapılıyor" className="text-current" /> : <>Giriş yap<ArrowRight className="size-4" /></>}</AdminButton>
    </form>
  );
}
