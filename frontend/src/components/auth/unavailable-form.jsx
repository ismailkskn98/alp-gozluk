'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { SiteButton } from '@/components/site/ui/button';
import { SiteInput } from '@/components/site/ui/input';

export default function UnavailableForm({ locale, type = 'email' }) {
  const [message, setMessage] = useState('');
  const tr = locale === 'tr';
  return (
    <form onSubmit={(event) => { event.preventDefault(); setMessage(tr ? 'Bu akış backend entegrasyonu tamamlandığında etkinleşecek.' : 'This flow will be enabled after the backend integration is complete.'); }} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="value">{type === 'password' ? (tr ? 'Yeni şifre' : 'New password') : (tr ? 'E-posta' : 'Email')}</Label>
        <SiteInput id="value" type={type} autoComplete={type === 'password' ? 'new-password' : 'email'} required />
      </div>
      <SiteButton type="submit" size="wide">{tr ? 'Devam et' : 'Continue'}</SiteButton>
      {message ? <p role="status" className="text-sm text-warning">{message}</p> : null}
    </form>
  );
}
