'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function UnavailableForm({ locale, type = 'email' }) {
  const [message, setMessage] = useState('');
  const tr = locale === 'tr';
  return (
    <form onSubmit={(event) => { event.preventDefault(); setMessage(tr ? 'Bu akış backend entegrasyonu tamamlandığında etkinleşecek.' : 'This flow will be enabled after the backend integration is complete.'); }} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="value">{type === 'password' ? (tr ? 'Yeni şifre' : 'New password') : (tr ? 'E-posta' : 'Email')}</Label>
        <Input id="value" type={type} autoComplete={type === 'password' ? 'new-password' : 'email'} required />
      </div>
      <button className="h-11 w-full rounded-md bg-primary text-sm font-semibold text-white">{tr ? 'Devam et' : 'Continue'}</button>
      {message ? <p role="status" className="text-sm text-warning">{message}</p> : null}
    </form>
  );
}
