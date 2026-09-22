'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { UserPlus } from 'lucide-react';
import { AdminButton } from '@/components/admin/ui/button';
import { adminInputClass, AdminFormField } from '@/components/admin/ui/form-field';

const schema = z.object({
  firstName: z.string().trim().min(2, 'En az 2 karakter girin.').max(80),
  lastName: z.string().trim().min(2, 'En az 2 karakter girin.').max(80),
  email: z.email('Geçerli bir e-posta adresi girin.'),
  password: z.string()
    .min(12, 'Şifre en az 12 karakter olmalıdır.')
    .max(128)
    .regex(/[a-z]/, 'En az bir küçük harf girin.')
    .regex(/[A-Z]/, 'En az bir büyük harf girin.')
    .regex(/\d/, 'En az bir rakam girin.'),
  roleCodes: z.array(z.string()).min(1, 'En az bir rol seçin.'),
});

export default function CreateUserForm({ roles, onCreated, compact = false }) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { roleCodes: [] },
  });

  async function submit(values) {
    const response = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message || 'Kullanıcı oluşturulamadı.');
    reset();
    onCreated(payload.data.user);
  }

  return (
    <form onSubmit={handleSubmit(async (values) => {
      try { await submit(values); } catch (error) { onCreated(null, error.message); }
    })} className={compact ? '' : 'rounded-xl border border-border bg-card p-5 sm:p-6'} noValidate>
      {!compact ? <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Yeni panel hesabı</p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight">Yönetici kullanıcı oluştur</h2>
        <p className="mt-2 text-sm text-muted-foreground">Süper yönetici rolü buradan atanamaz. Yeni kullanıcı ilk girişinde 2FA açıksa Authenticator kurulumuna yönlendirilir.</p>
      </div> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <AdminFormField htmlFor="admin-first-name" label="Ad" error={errors.firstName?.message} required><input id="admin-first-name" className={adminInputClass} {...register('firstName')} /></AdminFormField>
        <AdminFormField htmlFor="admin-last-name" label="Soyad" error={errors.lastName?.message} required><input id="admin-last-name" className={adminInputClass} {...register('lastName')} /></AdminFormField>
        <AdminFormField htmlFor="admin-user-email" label="E-posta" error={errors.email?.message} required><input id="admin-user-email" className={adminInputClass} type="email" autoComplete="off" {...register('email')} /></AdminFormField>
        <AdminFormField htmlFor="admin-user-password" label="Geçici şifre" error={errors.password?.message} hint="Min. 12 karakter" required><input id="admin-user-password" className={adminInputClass} type="password" autoComplete="new-password" {...register('password')} /></AdminFormField>
      </div>
      <fieldset className="mt-5">
        <legend className="text-sm font-medium">Roller</legend>
        <div className="mt-3 flex flex-wrap gap-3">
          {roles.map((role) => (
            <label key={role.code} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
              <input type="checkbox" value={role.code} {...register('roleCodes')} />
              {role.name}
            </label>
          ))}
        </div>
        {errors.roleCodes ? <p className="mt-2 text-sm text-danger">{errors.roleCodes.message}</p> : null}
      </fieldset>
      <AdminButton type="submit" disabled={isSubmitting} className="mt-6 w-full"><UserPlus className="size-4" />{isSubmitting ? 'Oluşturuluyor…' : 'Kullanıcı oluştur'}</AdminButton>
    </form>
  );
}
