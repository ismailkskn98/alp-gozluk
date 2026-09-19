'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const schema = z.object({
  code: z.string().trim().min(2).max(80).regex(/^[A-Za-z0-9][A-Za-z0-9_-]+$/, 'Yalnız harf, rakam, tire ve alt çizgi kullanın.'),
  name: z.string().trim().min(2).max(190),
  slug: z.string().trim().min(2).max(190).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Küçük harf, rakam ve tire kullanın.'),
  shortDescription: z.string().trim().max(500).optional(),
  sku: z.string().trim().min(2).max(100),
  price: z.coerce.number().min(0),
  stockQuantity: z.coerce.number().int().min(0),
  status: z.enum(['draft', 'published']),
});

export default function ProductForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { status: 'draft', stockQuantity: 0 },
  });

  async function onSubmit(values) {
    setServerError('');
    const response = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: values.code,
        brand: 'ALP Gözlük',
        status: values.status,
        featured: false,
        taxRate: 20,
        translations: [{ locale: 'tr', name: values.name, slug: values.slug, shortDescription: values.shortDescription }],
        variants: [{ sku: values.sku, price: values.price, stockQuantity: values.stockQuantity, lowStockThreshold: 5 }],
      }),
    });
    const payload = await response.json();
    if (!response.ok) { setServerError(payload.message || 'Ürün oluşturulamadı.'); return; }
    router.push('/admin/products');
    router.refresh();
  }

  const fields = [
    ['code', 'Ürün kodu', 'ALP-ATLAS-01', 'text'],
    ['name', 'Ürün adı', 'Atlas 01', 'text'],
    ['slug', 'URL adı', 'atlas-01', 'text'],
    ['sku', 'SKU', 'ALP-ATLAS-01-BLK', 'text'],
    ['price', 'Satış fiyatı (TRY)', '3490', 'number'],
    ['stockQuantity', 'Başlangıç stoğu', '0', 'number'],
  ];

  return <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-7" noValidate><section className="rounded-lg border border-border bg-white p-5 sm:p-6"><h2 className="font-semibold">Temel bilgiler</h2><div className="mt-5 grid gap-5 sm:grid-cols-2">{fields.map(([name, label, placeholder, type]) => <div key={name} className="space-y-2"><Label htmlFor={name}>{label}</Label><Input id={name} type={type} step={name === 'price' ? '0.01' : undefined} placeholder={placeholder} aria-invalid={Boolean(errors[name])} {...register(name)} />{errors[name] ? <p className="text-xs text-danger">{errors[name].message}</p> : null}</div>)}</div><div className="mt-5 space-y-2"><Label htmlFor="shortDescription">Kısa açıklama</Label><textarea id="shortDescription" rows={4} className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" {...register('shortDescription')} /></div></section><section className="rounded-lg border border-border bg-white p-5 sm:p-6"><Label htmlFor="status">Yayın durumu</Label><select id="status" className="mt-2 h-10 w-full rounded-md border border-input bg-white px-3 text-sm" {...register('status')}><option value="draft">Taslak</option><option value="published">Yayında</option></select><p className="mt-2 text-xs text-muted-foreground">Yayındaki ürün, Türkçe katalog API’sinde görünür.</p></section>{serverError ? <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{serverError}</p> : null}<div className="flex justify-end gap-2"><button type="button" onClick={() => router.back()} className="h-10 rounded-md border border-border-strong bg-white px-4 text-sm font-medium">Vazgeç</button><button type="submit" disabled={isSubmitting} className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-white disabled:opacity-60">{isSubmitting ? 'Kaydediliyor…' : 'Ürünü kaydet'}</button></div></form>;
}
