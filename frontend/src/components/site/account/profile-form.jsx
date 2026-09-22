'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, LoaderCircle, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const profileSchema = z.object({
  firstName: z.string().trim().min(2, 'En az 2 karakter yazın.').max(80),
  lastName: z.string().trim().min(2, 'En az 2 karakter yazın.').max(80),
  phone: z.string().trim().max(32),
  birthDate: z.string().optional(),
  gender: z.enum(['', 'female', 'male', 'prefer_not_to_say']),
  marketingEmailOptIn: z.boolean(),
  marketingSmsOptIn: z.boolean(),
});

const inputClass = 'mt-2 h-11 w-full rounded-xl border border-black/12 bg-white px-3.5 text-sm outline-none transition focus:border-[#1b2635]';

export default function ProfileForm({ profile, onUpdated }) {
  const [message, setMessage] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({ resolver: zodResolver(profileSchema), defaultValues: { ...profile, gender: profile.gender || '', birthDate: profile.birthDate || '', marketingEmailOptIn: Boolean(profile.marketingEmailOptIn), marketingSmsOptIn: Boolean(profile.marketingSmsOptIn) } });
  useEffect(() => { reset({ ...profile, gender: profile.gender || '', birthDate: profile.birthDate || '', marketingEmailOptIn: Boolean(profile.marketingEmailOptIn), marketingSmsOptIn: Boolean(profile.marketingSmsOptIn) }); }, [profile, reset]);
  async function submit(values) {
    setMessage('');
    const response = await fetch('/api/account/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
    const payload = await response.json();
    if (!response.ok) { setMessage(payload.message || 'Profil güncellenemedi.'); return; }
    onUpdated(payload.data);
    setMessage('Profilin güncellendi.');
  }
  return <section><div><p className="text-sm text-[#69717b]">Kişisel tercihler ve iletişim bilgileri</p><h1 className="mt-1 text-[clamp(2rem,4vw,3rem)] tracking-[-0.05em]">Üyelik bilgilerim</h1></div><form onSubmit={handleSubmit(submit)} className="mt-7 max-w-3xl rounded-2xl border border-black/10 bg-white p-5 sm:p-7"><div className="grid gap-5 sm:grid-cols-2"><Field label="Ad" error={errors.firstName?.message}><input className={inputClass} autoComplete="given-name" {...register('firstName')} /></Field><Field label="Soyad" error={errors.lastName?.message}><input className={inputClass} autoComplete="family-name" {...register('lastName')} /></Field><Field label="E-posta"><input className={`${inputClass} bg-[#f5f6f3] text-[#68707b]`} value={profile.email} disabled /></Field><Field label="Telefon" error={errors.phone?.message}><input className={inputClass} inputMode="tel" autoComplete="tel" {...register('phone')} /></Field><Field label="Doğum tarihi"><input className={inputClass} type="date" {...register('birthDate')} /></Field><Field label="Cinsiyet"><select className={inputClass} {...register('gender')}><option value="">Belirtmek istemiyorum</option><option value="female">Kadın</option><option value="male">Erkek</option><option value="prefer_not_to_say">Belirtmek istemiyorum</option></select></Field></div><div className="mt-7 border-t border-black/8 pt-6"><h2 className="font-medium">İletişim tercihleri</h2><p className="mt-1 text-sm text-[#69717b]">Yalnızca sana uygun haber ve kampanyaları paylaşmak için kullanılır.</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><Toggle label="E-posta ile bilgilendir" inputProps={register('marketingEmailOptIn')} /><Toggle label="SMS ile bilgilendir" inputProps={register('marketingSmsOptIn')} /></div></div>{message ? <p role="status" className="mt-5 flex items-center gap-2 text-sm text-[#387158]"><CheckCircle2 className="size-4" />{message}</p> : null}<button type="submit" disabled={isSubmitting} className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1b2635] px-5 text-sm font-medium text-white transition hover:bg-[#28384d] disabled:opacity-60">{isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />} Değişiklikleri kaydet</button></form></section>;
}
function Field({ label, error, children }) { return <label className="block text-sm font-medium">{label}{children}{error ? <span className="mt-1 block text-xs text-[#bb3d3d]">{error}</span> : null}</label>; }
function Toggle({ label, inputProps }) { return <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-black/10 px-4 text-sm"><input type="checkbox" className="size-4 accent-[#1b2635]" {...inputProps} />{label}</label>; }
