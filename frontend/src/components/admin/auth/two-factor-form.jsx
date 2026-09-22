'use client';

import Image from 'next/image';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { AdminButton } from '@/components/admin/ui/button';
import { adminInputClass, AdminFormField } from '@/components/admin/ui/form-field';
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/components/admin/ui/input-otp';

const schema = z.object({
  code: z.string().trim().refine(
    (value) => /^\d{6}$/.test(value) || /^[A-Za-z0-9-]{16,24}$/.test(value),
    '6 haneli kodu veya kurtarma kodunu girin.',
  ),
});

export default function TwoFactorForm({ setup, onSubmit, onBack, serverError }) {
  const [recoveryMode, setRecoveryMode] = useState(false);
  const { control, register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema), defaultValues: { code: '' } });

  return (
    <div className="space-y-6">
      {setup ? (
        <div className="space-y-4 rounded-lg border border-border bg-background p-4">
          <p className="text-sm leading-6 text-muted-foreground">QR kodunu Google Authenticator veya başka bir TOTP uygulamasıyla tara.</p>
          <Image src={setup.qrCodeDataUrl} alt="Authenticator QR kodu" width={280} height={280} unoptimized className="mx-auto size-56" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Manuel kurulum anahtarı</p>
            <code className="mt-2 block break-all rounded bg-muted p-3 text-xs">{setup.secret}</code>
          </div>
        </div>
      ) : (
        <p className="text-sm leading-6 text-muted-foreground">Authenticator uygulamandaki 6 haneli kodu gir.</p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {recoveryMode ? <AdminFormField htmlFor="admin-recovery-code" label="Kurtarma kodu" error={errors.code?.message} required><input id="admin-recovery-code" className={adminInputClass} autoComplete="one-time-code" aria-invalid={Boolean(errors.code)} placeholder="XXXX-XXXX-XXXX-XXXX" {...register('code')} /></AdminFormField> : <AdminFormField label="6 haneli doğrulama kodu" error={errors.code?.message} required><Controller name="code" control={control} render={({ field }) => <InputOTP aria-label="İki faktörlü doğrulama kodu" maxLength={6} status={errors.code ? 'error' : field.value.length === 6 ? 'success' : 'idle'} value={field.value} onChange={field.onChange} autoComplete="one-time-code"><InputOTPGroup>{[0, 1, 2].map((index) => <InputOTPSlot key={index} index={index} />)}</InputOTPGroup><InputOTPSeparator /><InputOTPGroup>{[3, 4, 5].map((index) => <InputOTPSlot key={index} index={index} />)}</InputOTPGroup></InputOTP>} /></AdminFormField>}
        <button type="button" onClick={() => setRecoveryMode((value) => !value)} className="text-xs font-medium text-primary hover:underline">{recoveryMode ? 'Authenticator kodu kullan' : 'Kurtarma kodu kullan'}</button>
        {serverError ? <p role="alert" className="rounded-xl border border-danger/20 bg-danger/10 p-3 text-sm text-danger">{serverError}</p> : null}
        <AdminButton type="submit" disabled={isSubmitting} className="min-h-12 w-full"><ShieldCheck className="size-4" />{isSubmitting ? 'Doğrulanıyor…' : setup ? 'Kurulumu tamamla' : 'Doğrula'}</AdminButton>
        <button type="button" onClick={onBack} className="flex w-full items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />Girişe geri dön</button>
      </form>
    </div>
  );
}
