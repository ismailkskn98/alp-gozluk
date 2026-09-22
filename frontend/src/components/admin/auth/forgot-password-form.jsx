'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, MailWarning } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import AdminAlert from '@/components/admin/ui/alert';
import { AdminButton } from '@/components/admin/ui/button';
import { adminInputClass, AdminFormField } from '@/components/admin/ui/form-field';

const schema = z.object({ email: z.email('Geçerli bir e-posta adresi girin.') });

export default function ForgotPasswordForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });
  return <form onSubmit={handleSubmit(() => {})} className="space-y-5" noValidate><AdminFormField htmlFor="admin-reset-email" label="Yönetici e-postası" error={errors.email?.message} required><input id="admin-reset-email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} className={adminInputClass} placeholder="yonetici@alpgozluk.com" {...register('email')} /></AdminFormField><AdminAlert title="E-posta servisi henüz bağlı değil" variant="warning"><span className="inline-flex items-start gap-1.5"><MailWarning className="mt-0.5 size-3.5 shrink-0" />Sahte bir başarılı durum göstermemek için sıfırlama talebi backend mail akışı tamamlanana kadar gönderilemez.</span></AdminAlert><AdminButton className="w-full" disabled>Bağlantı gönder <ArrowRight className="size-4" /></AdminButton></form>;
}
