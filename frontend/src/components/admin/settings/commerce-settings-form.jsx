'use client';

import { LoaderCircle, Save, Truck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AdminButton } from '@/components/admin/ui/button';
import { AdminFormField, adminInputClass } from '@/components/admin/ui/form-field';

const defaultValues = { dispatchMinDays: 1, dispatchMaxDays: 3, returnWindowDays: 14 };

export default function CommerceSettingsForm() {
  const [values, setValues] = useState(defaultValues);
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/admin/settings/commerce', { cache: 'no-store' })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message);
        if (active) {
          setValues({ ...defaultValues, ...payload.data?.settings });
          setStatus('idle');
        }
      })
      .catch(() => {
        if (active) {
          setMessage('Teslimat ayarları yüklenemedi.');
          setStatus('error');
        }
      });
    return () => { active = false; };
  }, []);

  function change(field, rawValue) {
    setValues((current) => ({ ...current, [field]: Number(rawValue) }));
    setMessage('');
  }

  async function save(event) {
    event.preventDefault();
    if (values.dispatchMaxDays < values.dispatchMinDays) {
      setMessage('En geç kargoya veriliş süresi, en erken süreden küçük olamaz.');
      return;
    }
    setStatus('saving');
    setMessage('');
    try {
      const response = await fetch('/api/admin/settings/commerce', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message);
      setValues(payload.data.settings);
      setMessage('Teslimat ve iade bilgileri kaydedildi.');
      setStatus('success');
    } catch (error) {
      setMessage(error.message || 'Ayarlar kaydedilemedi.');
      setStatus('error');
    }
  }

  return (
    <section className="w-full max-w-5xl rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(16,35,61,0.03)] sm:p-6">
      <div className="mb-6 flex items-start gap-3 border-b border-border pb-5">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-border bg-muted/55"><Truck className="size-4" /></span>
        <div><h2 className="text-base font-semibold">Teslimat ve iade bilgileri</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Ürün detayında tüm ürünler için ortak gösterilen süreler.</p></div>
      </div>
      <form onSubmit={save}>
        <div className="grid gap-5 md:grid-cols-3">
          <AdminFormField label="En erken kargoya veriliş" hint="İş günü">
            <input className={adminInputClass} type="number" min="0" max="30" value={values.dispatchMinDays} disabled={status === 'loading'} onChange={(event) => change('dispatchMinDays', event.target.value)} />
          </AdminFormField>
          <AdminFormField label="En geç kargoya veriliş" hint="İş günü">
            <input className={adminInputClass} type="number" min="0" max="60" value={values.dispatchMaxDays} disabled={status === 'loading'} onChange={(event) => change('dispatchMaxDays', event.target.value)} />
          </AdminFormField>
          <AdminFormField label="İade süresi" hint="Teslimden itibaren gün">
            <input className={adminInputClass} type="number" min="1" max="365" value={values.returnWindowDays} disabled={status === 'loading'} onChange={(event) => change('returnWindowDays', event.target.value)} />
          </AdminFormField>
        </div>
        <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className={`text-sm ${status === 'error' ? 'text-destructive' : 'text-muted-foreground'}`} role="status">{message || 'Tarih aralığı hafta sonları atlanarak hesaplanır.'}</p>
          <AdminButton type="submit" disabled={status === 'loading' || status === 'saving'}>
            {status === 'saving' ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
            Kaydet
          </AdminButton>
        </div>
      </form>
    </section>
  );
}
