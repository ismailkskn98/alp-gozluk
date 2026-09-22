'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, LoaderCircle, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { SiteButton } from '@/components/site/ui/button';
import { SiteCheckbox } from '@/components/site/ui/checkbox';
import { siteInputClassName } from '@/components/site/ui/input';
import { SiteSelect } from '@/components/site/ui/select';
import AccountSectionHeader from './section-header';

const profileSchema = z.object({
  firstName: z.string().trim().min(2, 'En az 2 karakter yazın.').max(80),
  lastName: z.string().trim().min(2, 'En az 2 karakter yazın.').max(80),
  phone: z.string().trim().max(32),
  birthDate: z.string().optional(),
  gender: z.enum(['', 'female', 'male', 'prefer_not_to_say']),
  marketingEmailOptIn: z.boolean(),
  marketingSmsOptIn: z.boolean(),
});

const inputClass = `${siteInputClassName} mt-1.5`;

const genderOptions = [
  { value: '', label: 'Belirtmek istemiyorum' },
  { value: 'female', label: 'Kadın' },
  { value: 'male', label: 'Erkek' },
  { value: 'prefer_not_to_say', label: 'Belirtmek istemiyorum' },
];

export default function ProfileForm({ profile, onUpdated }) {
  const [notice, setNotice] = useState(null);
  const {
    register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue, control,
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      ...profile,
      gender: profile.gender || '',
      birthDate: profile.birthDate || '',
      marketingEmailOptIn: Boolean(profile.marketingEmailOptIn),
      marketingSmsOptIn: Boolean(profile.marketingSmsOptIn),
    },
  });
  const marketingEmailOptIn = useWatch({ control, name: 'marketingEmailOptIn' });
  const marketingSmsOptIn = useWatch({ control, name: 'marketingSmsOptIn' });

  useEffect(() => {
    reset({
      ...profile,
      gender: profile.gender || '',
      birthDate: profile.birthDate || '',
      marketingEmailOptIn: Boolean(profile.marketingEmailOptIn),
      marketingSmsOptIn: Boolean(profile.marketingSmsOptIn),
    });
  }, [profile, reset]);

  async function submit(values) {
    setNotice(null);
    const response = await fetch('/api/account/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    const payload = await response.json();
    if (!response.ok) {
      setNotice({ type: 'error', text: payload.message || 'Profil güncellenemedi.' });
      return;
    }
    onUpdated(payload.data);
    setNotice({ type: 'success', text: 'Bilgilerin güncellendi.' });
  }

  return (
    <section>
      <AccountSectionHeader
        kicker="Kişisel ve iletişim bilgilerin"
        title="Üyelik bilgilerim"
        description="Teslimat iletişimi ve sana uygun bilgilendirmeler için kullandığımız bilgileri güncelle."
      />
      <form onSubmit={handleSubmit(submit)} className="mt-7 max-w-4xl">
        <section aria-labelledby="identity-heading" className="border-y border-[#d8ddd7] py-6">
          <div className="grid gap-6 lg:grid-cols-[13rem_minmax(0,1fr)]">
            <div>
              <h3 id="identity-heading" className="font-medium text-[#172536]">Kişisel bilgiler</h3>
              <p className="mt-2 text-xs leading-5 text-[#68736f]">Sipariş ve teslimat belgelerinde kullanılır.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Ad" error={errors.firstName?.message}><input className={inputClass} autoComplete="given-name" {...register('firstName')} /></Field>
              <Field label="Soyad" error={errors.lastName?.message}><input className={inputClass} autoComplete="family-name" {...register('lastName')} /></Field>
              <Field label="E-posta"><input className={inputClass} value={profile.email} disabled /></Field>
              <Field label="Telefon" error={errors.phone?.message}><input className={inputClass} inputMode="tel" autoComplete="tel" placeholder="05xx xxx xx xx" {...register('phone')} /></Field>
              <Field label="Doğum tarihi"><input className={inputClass} type="date" {...register('birthDate')} /></Field>
              <Field label="Cinsiyet">
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <SiteSelect
                      name={field.name}
                      value={field.value}
                      onValueChange={field.onChange}
                      options={genderOptions}
                      placeholder="Seç"
                      className="mt-1.5"
                    />
                  )}
                />
              </Field>
            </div>
          </div>
        </section>

        <section aria-labelledby="preferences-heading" className="border-b border-[#d8ddd7] py-6">
          <div className="grid gap-6 lg:grid-cols-[13rem_minmax(0,1fr)]">
            <div>
              <h3 id="preferences-heading" className="font-medium text-[#172536]">İletişim tercihleri</h3>
              <p className="mt-2 text-xs leading-5 text-[#68736f]">İzinlerini istediğin zaman değiştirebilirsin.</p>
            </div>
            <div className="divide-y divide-[#d8ddd7]">
              <PreferenceRow title="E-posta" description="Yeni koleksiyonlar ve sana özel kampanyalar" checked={marketingEmailOptIn} onChange={(value) => setValue('marketingEmailOptIn', value, { shouldDirty: true })} />
              <PreferenceRow title="SMS" description="Kısa süreli fırsatlar ve sipariş bilgilendirmeleri" checked={marketingSmsOptIn} onChange={(value) => setValue('marketingSmsOptIn', value, { shouldDirty: true })} />
            </div>
          </div>
        </section>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <SiteButton type="submit" disabled={isSubmitting} size="compact">
            {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />} Değişiklikleri kaydet
          </SiteButton>
          {notice ? <p role={notice.type === 'error' ? 'alert' : 'status'} className={`flex items-center gap-2 text-sm ${notice.type === 'error' ? 'text-[#a53e3e]' : 'text-[#387158]'}`}><CheckCircle2 className="size-4" />{notice.text}</p> : null}
        </div>
      </form>
    </section>
  );
}

function Field({ label, error, children }) {
  return <label className="block text-sm font-medium text-[#263630]">{label}{children}{error ? <span className="mt-1.5 block text-xs font-normal text-[#a53e3e]">{error}</span> : null}</label>;
}

function PreferenceRow({ title, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-5 py-4 first:pt-0 last:pb-0">
      <div>
        <p className="text-sm font-medium text-[#172536]">{title}</p>
        <p className="mt-1 text-xs leading-5 text-[#68736f]">{description}</p>
      </div>
      <SiteCheckbox checked={checked} onCheckedChange={onChange} aria-label={`${title} ile bilgilendirme`} />
    </div>
  );
}
