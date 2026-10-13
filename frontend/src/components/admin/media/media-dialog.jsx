'use client';

import { LoaderCircle, Save, Upload } from 'lucide-react';
import { useState } from 'react';
import AdminDropzone from '@/components/admin/ui/dropzone';
import { AdminButton } from '@/components/admin/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/admin/ui/dialog';
import { AdminFormField, adminInputClass } from '@/components/admin/ui/form-field';
import { AdminSelect } from '@/components/admin/ui/select';

const roleOptions = [
  { value: 'gallery', label: 'Ürün galerisi' },
  { value: 'on_model', label: 'Model üzerinde' },
  { value: 'editorial', label: 'Editoryal / kampanya' },
];

const emptyValues = {
  productId: '',
  mediaRole: 'on_model',
  modelName: '',
  altText: '',
  sortOrder: '0',
  isFeatured: false,
};

export default function MediaDialog({ open, onOpenChange, products, media, onSaved }) {
  const editing = Boolean(media);
  const [values, setValues] = useState(() => media ? {
    productId: String(media.entityId),
    mediaRole: media.mediaRole || 'gallery',
    modelName: media.modelName || '',
    altText: media.altText || '',
    sortOrder: String(media.sortOrder || 0),
    isFeatured: Boolean(media.isFeatured),
  } : emptyValues);
  const [files, setFiles] = useState([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  function change(field, value) {
    setValues((current) => ({
      ...current,
      [field]: value,
      ...(field === 'mediaRole' && value === 'gallery' ? { modelName: '' } : {}),
    }));
  }

  async function submit(event) {
    event.preventDefault();
    if (!values.productId) return setError('Bir ürün seçin.');
    if (!editing && files.length === 0) return setError('En az bir görsel seçin.');
    setPending(true);
    setError('');

    try {
      const metadata = {
        altText: values.altText.trim(),
        mediaRole: values.mediaRole,
        modelName: values.mediaRole === 'gallery' ? '' : values.modelName.trim(),
        sortOrder: Number(values.sortOrder),
        isFeatured: values.isFeatured,
      };

      if (editing) {
        const metadataResponse = await fetch(`/api/admin/media/${media.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(metadata),
        });
        const metadataPayload = await metadataResponse.json();
        if (!metadataResponse.ok) throw new Error(metadataPayload.message || 'Medya bilgileri güncellenemedi.');

        if (files[0]) {
          const replacement = new FormData();
          replacement.append('image', files[0]);
          const replaceResponse = await fetch(`/api/admin/media/${media.id}/replace`, { method: 'PUT', body: replacement });
          const replacePayload = await replaceResponse.json();
          if (!replaceResponse.ok) throw new Error(replacePayload.message || 'Görsel değiştirilemedi.');
        }
      } else {
        const formData = new FormData();
        formData.append('entityType', 'product');
        formData.append('entityId', values.productId);
        Object.entries(metadata).forEach(([key, value]) => formData.append(key, String(value)));
        files.forEach((file) => formData.append('images', file));
        const response = await fetch('/api/admin/media', { method: 'POST', body: formData });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || 'Görseller yüklenemedi.');
      }

      await onSaved();
      onOpenChange(false);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!pending) onOpenChange(nextOpen); }}>
      <DialogContent showClose={!pending} className="w-[min(94vw,42rem)]">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{editing ? 'Medya kaydını düzenle' : 'Ürün görseli yükle'}</DialogTitle>
            <DialogDescription>{editing ? 'Görselin kullanım alanını, model bilgisini veya dosyasını değiştirin.' : 'Dosya storage alanına yüklenir ve seçtiğiniz ürüne bağlanır.'}</DialogDescription>
          </DialogHeader>

          <div className="mt-6 space-y-5">
            <AdminFormField label="Ürün" required>
              <AdminSelect
                value={values.productId}
                onValueChange={(value) => change('productId', value)}
                disabled={editing || pending}
                options={[{ value: '', label: 'Ürün seçin' }, ...products.map((product) => ({ value: String(product.id), label: `${product.name} · ${product.code}` }))]}
              />
            </AdminFormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <AdminFormField label="Kullanım alanı" required>
                <AdminSelect value={values.mediaRole} onValueChange={(value) => change('mediaRole', value)} disabled={pending} options={roleOptions} />
              </AdminFormField>
              <AdminFormField label="Model adı" hint={values.mediaRole === 'gallery' ? 'Galeri için kullanılmaz' : 'Panel içi arama için'}>
                <input className={adminInputClass} maxLength={120} disabled={pending || values.mediaRole === 'gallery'} value={values.modelName} onChange={(event) => change('modelName', event.target.value)} placeholder="Örn. Sueda" />
              </AdminFormField>
            </div>
            <AdminFormField label="Alternatif metin" hint="Erişilebilirlik ve SEO">
              <input className={adminInputClass} maxLength={255} disabled={pending} value={values.altText} onChange={(event) => change('altText', event.target.value)} placeholder="Prada PR17WS gözlük" />
            </AdminFormField>
            <div className="grid items-end gap-4 sm:grid-cols-2">
              <AdminFormField label="Sıralama">
                <input className={adminInputClass} type="number" min="0" max="10000" disabled={pending} value={values.sortOrder} onChange={(event) => change('sortOrder', event.target.value)} />
              </AdminFormField>
              <label className="flex min-h-11 items-center gap-3 rounded-xl border border-input px-3 text-sm">
                <input type="checkbox" className="size-4 accent-primary" checked={values.isFeatured} disabled={pending} onChange={(event) => change('isFeatured', event.target.checked)} />
                Öne çıkan görsel
              </label>
            </div>
            <AdminFormField label={editing ? 'Dosyayı değiştir' : 'Görseller'} hint={editing ? 'İsteğe bağlı' : 'En fazla 8 dosya'}>
              <AdminDropzone key={`${media?.id || 'new'}-${open}`} maxFiles={editing ? 1 : 8} onChange={setFiles} />
            </AdminFormField>
            {error ? <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p> : null}
          </div>

          <DialogFooter>
            <AdminButton type="button" variant="secondary" disabled={pending} onClick={() => onOpenChange(false)}>Vazgeç</AdminButton>
            <AdminButton type="submit" disabled={pending}>
              {pending ? <LoaderCircle className="size-4 animate-spin" /> : editing ? <Save className="size-4" /> : <Upload className="size-4" />}
              {pending ? 'Kaydediliyor…' : editing ? 'Değişiklikleri kaydet' : 'Görselleri yükle'}
            </AdminButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
