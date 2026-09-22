'use client';

import { Eye, EyeOff, LockKeyhole } from 'lucide-react';
import { useState } from 'react';
import AdminAlert from '@/components/admin/ui/alert';
import { AdminButton } from '@/components/admin/ui/button';
import { adminInputClass, AdminFormField } from '@/components/admin/ui/form-field';

export default function ResetPasswordForm() {
  const [visible, setVisible] = useState(false);
  return <form className="space-y-5"><AdminFormField htmlFor="admin-new-password" label="Yeni şifre" hint="En az 12 karakter" required><div className="relative"><input id="admin-new-password" type={visible ? 'text' : 'password'} autoComplete="new-password" disabled className={`${adminInputClass} pr-11`} /><button type="button" onClick={() => setVisible((value) => !value)} className="absolute right-1 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-muted-foreground" aria-label={visible ? 'Şifreyi gizle' : 'Şifreyi göster'}>{visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div></AdminFormField><AdminFormField htmlFor="admin-new-password-confirmation" label="Yeni şifre tekrarı" required><input id="admin-new-password-confirmation" type="password" autoComplete="new-password" disabled className={adminInputClass} /></AdminFormField><AdminAlert title="Token doğrulama akışı bekleniyor" variant="warning">Bu ekran hazırdır; parola yalnız backend tek kullanımlık tokenı doğruladığında değiştirilecektir.</AdminAlert><AdminButton className="w-full" disabled><LockKeyhole className="size-4" />Şifreyi güncelle</AdminButton></form>;
}
