'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ImageIcon, Languages, LoaderCircle, RefreshCw, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { homepageContentDefaults, homepageImageFallbacks, mergeHomepageContent } from '@/data/homepage-content';
import AdminAlert from '@/components/admin/ui/alert';
import { AdminButton } from '@/components/admin/ui/button';
import { adminInputClass, AdminFormField } from '@/components/admin/ui/form-field';
import HomepageImageField from './image-field';

const copyValue = z.string().trim().min(1, 'Bu alan boş bırakılamaz.').max(600, 'Metin çok uzun.');
const cardList = (length) => z.array(z.object({ title: copyValue, description: copyValue })).length(length);
const localeSchema = z.object({
  hero: z.object({ title: copyValue, description: copyValue, primaryAction: copyValue, secondaryAction: copyValue }),
  featured: z.object({ title: copyValue, description: copyValue, action: copyValue }),
  modelShowcase: z.object({ title: copyValue, description: copyValue, featured: copyValue, action: copyValue }),
  categories: z.object({ title: copyValue, description: copyValue, sunglasses: copyValue, sunglassesCopy: copyValue, darkFrames: copyValue, darkFramesCopy: copyValue, action: copyValue, darkFramesAction: copyValue }),
  frameStory: z.object({ title: copyValue, description: copyValue, action: copyValue, visualLabel: copyValue, points: cardList(4) }),
  services: cardList(3),
});
const schema = z.object({
  tr: localeSchema,
  en: localeSchema,
  images: z.object({ categoryPrimary: z.number().int().positive().nullable(), categorySecondary: z.number().int().positive().nullable(), frameStory: z.number().int().positive().nullable() }),
});

const sections = [
  { key: 'hero', label: 'Hero', description: 'Ana başlık ve yönlendirmeler', fields: [['title', 'Başlık', true], ['description', 'Açıklama', true], ['primaryAction', 'Birincil aksiyon'], ['secondaryAction', 'İkincil aksiyon']] },
  { key: 'featured', label: 'Öne çıkan ürünler', description: 'Ürün seçkisinin giriş metni', fields: [['title', 'Başlık', true], ['description', 'Açıklama', true], ['action', 'Liste aksiyonu']] },
  { key: 'modelShowcase', label: 'Model alanı', description: 'Ürünlerin model üzerindeki sunumu', fields: [['title', 'Başlık', true], ['description', 'Açıklama', true], ['featured', 'Öne çıkan etiketi'], ['action', 'Ürün aksiyonu']] },
  { key: 'categories', label: 'Kategori alanı', description: 'İki kategori kartı ve metinleri', fields: [['title', 'Bölüm başlığı', true], ['description', 'Bölüm açıklaması', true], ['sunglasses', 'İlk kart başlığı'], ['sunglassesCopy', 'İlk kart açıklaması', true], ['action', 'İlk kart aksiyonu'], ['darkFrames', 'İkinci kart başlığı'], ['darkFramesCopy', 'İkinci kart açıklaması', true], ['darkFramesAction', 'İkinci kart aksiyonu']] },
  { key: 'frameStory', label: 'Çerçeve hikâyesi', description: 'Geniş görsel ve bilgi maddeleri', fields: [['title', 'Başlık', true], ['description', 'Açıklama', true], ['action', 'Aksiyon'], ['visualLabel', 'Görsel alternatif metni']] },
  { key: 'services', label: 'Hizmet şeridi', description: 'Sayfa altındaki üç güven mesajı' },
  { key: 'images', label: 'Anasayfa görselleri', description: 'Yalnız bu sayfaya ait sabit görseller' },
];

const emptyImageIds = { categoryPrimary: null, categorySecondary: null, frameStory: null };

function toFormValues(config = {}) {
  const content = mergeHomepageContent(config);
  return {
    ...content,
    images: {
      categoryPrimary: config.images?.categoryPrimary?.mediaAssetId || null,
      categorySecondary: config.images?.categorySecondary?.mediaAssetId || null,
      frameStory: config.images?.frameStory?.mediaAssetId || null,
    },
  };
}

export default function HomepageContentEditor() {
  const [activeSection, setActiveSection] = useState('hero');
  const [activeLocale, setActiveLocale] = useState('tr');
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [imageUrls, setImageUrls] = useState({ ...homepageImageFallbacks });
  const { control, register, reset, setValue, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { ...homepageContentDefaults, images: emptyImageIds },
  });

  const imageIds = useWatch({ control, name: 'images' });

  async function loadContent() {
    setLoading(true);
    setFeedback(null);
    try {
      const response = await fetch('/api/admin/homepage', { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Anasayfa içeriği alınamadı.');
      const config = payload.data?.config || {};
      reset(toFormValues(config));
      setImageUrls({
        categoryPrimary: config.images?.categoryPrimary?.url || homepageImageFallbacks.categoryPrimary,
        categorySecondary: config.images?.categorySecondary?.url || homepageImageFallbacks.categorySecondary,
        frameStory: config.images?.frameStory?.url || homepageImageFallbacks.frameStory,
      });
    } catch (error) {
      setFeedback({ variant: 'danger', title: 'Anasayfa içeriği yüklenemedi', message: error.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    fetch('/api/admin/homepage', { cache: 'no-store' })
      .then(async (response) => ({ ok: response.ok, payload: await response.json() }))
      .then(({ ok, payload }) => {
        if (!active) return;
        if (!ok) throw new Error(payload.message || 'Anasayfa içeriği alınamadı.');
        const config = payload.data?.config || {};
        reset(toFormValues(config));
        setImageUrls({
          categoryPrimary: config.images?.categoryPrimary?.url || homepageImageFallbacks.categoryPrimary,
          categorySecondary: config.images?.categorySecondary?.url || homepageImageFallbacks.categorySecondary,
          frameStory: config.images?.frameStory?.url || homepageImageFallbacks.frameStory,
        });
      })
      .catch((error) => {
        if (active) setFeedback({ variant: 'danger', title: 'Anasayfa içeriği yüklenemedi', message: error.message });
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reset]);

  async function save(values) {
    setFeedback(null);
    try {
      const response = await fetch('/api/admin/homepage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Anasayfa içeriği kaydedilemedi.');
      reset(toFormValues(payload.data?.config || values));
      setFeedback({ variant: 'success', title: 'Anasayfa güncellendi', message: 'Metinler ve seçilen görseller yayındaki anasayfaya bağlandı.' });
    } catch (error) {
      setFeedback({ variant: 'danger', title: 'Anasayfa kaydedilemedi', message: error.message });
    }
  }

  function showFirstError(validationErrors) {
    const locale = validationErrors.tr ? 'tr' : validationErrors.en ? 'en' : null;
    if (locale) {
      const section = sections.find((item) => validationErrors[locale]?.[item.key]);
      setActiveLocale(locale);
      if (section) setActiveSection(section.key);
    } else if (validationErrors.images) {
      setActiveSection('images');
    }
    setFeedback({ variant: 'danger', title: 'Eksik alanlar var', message: 'İşaretlenen alanları kontrol edip yeniden kaydedin.' });
  }

  function updateImage(slot, nextImage) {
    setValue(`images.${slot}`, nextImage.mediaAssetId, { shouldDirty: true, shouldValidate: true });
    setImageUrls((current) => ({ ...current, [slot]: nextImage.imageUrl || homepageImageFallbacks[slot] }));
  }

  const section = sections.find((item) => item.key === activeSection);

  if (loading) return <div className="grid gap-5 lg:grid-cols-[15rem_minmax(0,1fr)]" aria-label="Anasayfa içeriği yükleniyor"><div className="h-80 animate-pulse rounded-xl border border-border bg-muted" /><div className="h-[38rem] animate-pulse rounded-xl border border-border bg-muted" /></div>;

  return (
    <form onSubmit={handleSubmit(save, showFirstError)} noValidate>
      {feedback ? <div className="mb-5"><AdminAlert variant={feedback.variant} title={feedback.title}>{feedback.message}</AdminAlert></div> : null}
      <div className="grid gap-5 xl:grid-cols-[15rem_minmax(0,1fr)]">
        <nav aria-label="Anasayfa bölümleri" className="self-start rounded-xl border border-border bg-card p-2 xl:sticky xl:top-24">
          {sections.map((item) => (
            <button key={item.key} type="button" onClick={() => setActiveSection(item.key)} aria-current={activeSection === item.key ? 'page' : undefined} className={`w-full rounded-lg px-3 py-3 text-left transition-colors ${activeSection === item.key ? 'bg-accent-soft text-primary' : 'hover:bg-muted'}`}>
              <span className="block text-sm font-medium">{item.label}</span><span className="mt-0.5 block text-xs leading-4 text-muted-foreground">{item.description}</span>
            </button>
          ))}
        </nav>

        <section className="min-w-0 rounded-xl border border-border border-t-2 border-t-primary bg-card p-5 sm:p-6">
          <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div><h2 className="font-semibold">{section.label}</h2><p className="mt-1 text-sm text-muted-foreground">{section.description}</p></div>
            {activeSection !== 'images' ? (
              <div className="inline-flex w-fit rounded-lg border border-border bg-muted/45 p-1" aria-label="İçerik dili">
                {[['tr', 'Türkçe'], ['en', 'English']].map(([locale, label]) => <button key={locale} type="button" onClick={() => setActiveLocale(locale)} aria-pressed={activeLocale === locale} className={`inline-flex min-h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium ${activeLocale === locale ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}><Languages className="size-3.5" />{label}</button>)}
              </div>
            ) : null}
          </div>

          {activeSection === 'images' ? (
            <div className="mt-6">
              <HomepageImageField title="İlk kategori kartı" description="Güneş gözlüğü kategori kartında kullanılır." altText="Güneş gözlükleri kategori görseli" mediaAssetId={imageIds?.categoryPrimary} imageUrl={imageUrls.categoryPrimary} fallbackUrl={homepageImageFallbacks.categoryPrimary} disabled={isSubmitting} onChanged={(image) => updateImage('categoryPrimary', image)} />
              <HomepageImageField title="İkinci kategori kartı" description="Koyu çerçeveler kategori kartında kullanılır." altText="Koyu çerçeveler kategori görseli" mediaAssetId={imageIds?.categorySecondary} imageUrl={imageUrls.categorySecondary} fallbackUrl={homepageImageFallbacks.categorySecondary} disabled={isSubmitting} onChanged={(image) => updateImage('categorySecondary', image)} />
              <HomepageImageField title="Çerçeve hikâyesi" description="Anasayfanın geniş çerçeve hikâyesi alanında kullanılır." altText="Çerçeve hikâyesi görseli" mediaAssetId={imageIds?.frameStory} imageUrl={imageUrls.frameStory} fallbackUrl={homepageImageFallbacks.frameStory} disabled={isSubmitting} onChanged={(image) => updateImage('frameStory', image)} />
            </div>
          ) : activeSection === 'services' ? (
            <div className="mt-6 grid gap-5 lg:grid-cols-3">
              {Array.from({ length: 3 }, (_, index) => <div key={index} className="space-y-4 rounded-xl border border-border bg-muted/20 p-4"><p className="text-xs font-semibold text-muted-foreground">Mesaj {index + 1}</p><AdminFormField label="Başlık" error={errors[activeLocale]?.services?.[index]?.title?.message}><input className={adminInputClass} {...register(`${activeLocale}.services.${index}.title`)} aria-invalid={Boolean(errors[activeLocale]?.services?.[index]?.title)} /></AdminFormField><AdminFormField label="Açıklama" error={errors[activeLocale]?.services?.[index]?.description?.message}><textarea rows={4} className={`${adminInputClass} min-h-24 py-2.5`} {...register(`${activeLocale}.services.${index}.description`)} aria-invalid={Boolean(errors[activeLocale]?.services?.[index]?.description)} /></AdminFormField></div>)}
            </div>
          ) : (
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {section.fields.map(([field, label, multiline]) => <AdminFormField key={field} label={label} error={errors[activeLocale]?.[activeSection]?.[field]?.message}>{multiline ? <textarea rows={4} className={`${adminInputClass} min-h-24 py-2.5`} {...register(`${activeLocale}.${activeSection}.${field}`)} aria-invalid={Boolean(errors[activeLocale]?.[activeSection]?.[field])} /> : <input className={adminInputClass} {...register(`${activeLocale}.${activeSection}.${field}`)} aria-invalid={Boolean(errors[activeLocale]?.[activeSection]?.[field])} />}</AdminFormField>)}
              {activeSection === 'frameStory' ? Array.from({ length: 4 }, (_, index) => <div key={index} className="space-y-4 rounded-xl border border-border bg-muted/20 p-4"><p className="text-xs font-semibold text-muted-foreground">Bilgi {index + 1}</p><AdminFormField label="Başlık" error={errors[activeLocale]?.frameStory?.points?.[index]?.title?.message}><input className={adminInputClass} {...register(`${activeLocale}.frameStory.points.${index}.title`)} /></AdminFormField><AdminFormField label="Açıklama" error={errors[activeLocale]?.frameStory?.points?.[index]?.description?.message}><textarea rows={3} className={`${adminInputClass} min-h-20 py-2.5`} {...register(`${activeLocale}.frameStory.points.${index}.description`)} /></AdminFormField></div>) : null}
            </div>
          )}

          <div className="mt-7 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-muted-foreground">Model ve ürün kartı görselleri ilgili ürünün düzenleme ekranından yönetilir.</p>
            <div className="flex gap-2">
              <AdminButton type="button" variant="secondary" onClick={loadContent} disabled={isSubmitting}><RefreshCw className="size-4" />Yenile</AdminButton>
              <AdminButton type="submit" disabled={isSubmitting}>{isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : activeSection === 'images' ? <ImageIcon className="size-4" /> : <Save className="size-4" />}{isSubmitting ? 'Kaydediliyor…' : 'Tüm içerikleri kaydet'}</AdminButton>
            </div>
          </div>
        </section>
      </div>
    </form>
  );
}
