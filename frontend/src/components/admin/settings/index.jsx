'use client';

import { Cloud, CreditCard, Globe2, KeyRound, Save, ShieldCheck, Truck } from 'lucide-react';
import { useState } from 'react';
import AdminPageHeader from '@/components/admin/page-header';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/admin/ui/accordion';
import AdminAlert from '@/components/admin/ui/alert';
import { AdminButton } from '@/components/admin/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/admin/ui/dialog';
import { adminInputClass, AdminFormField } from '@/components/admin/ui/form-field';
import StatusBadge from '@/components/admin/ui/status-badge';
import { AdminSelect } from '@/components/admin/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/admin/ui/tabs';

const sections = [
  ['store', 'Mağaza', Globe2], ['payments', 'Ödeme', CreditCard], ['shipping', 'Kargo', Truck], ['storage', 'Storage', Cloud], ['security', 'Güvenlik', ShieldCheck],
];

export default function AdminSettings() {
  return (
    <>
      <AdminPageHeader eyebrow="Sistem" title="Ayarlar" description="Mağaza, ödeme, kargo, storage ve güvenlik yapılandırmasını tek merkezden yönetin." actions={<AdminButton disabled><Save className="size-4" />Değişiklikleri kaydet</AdminButton>} />
      <AdminAlert title="Gizli bilgiler bu ekranda tutulmaz" variant="warning">API anahtarı ve parolalar environment değişkenlerinden okunur; panel yalnız etkinlik durumunu gösterir.</AdminAlert>
      <Tabs defaultValue="store" className="mt-5">
        <div className="max-w-full overflow-x-auto pb-1 [scrollbar-width:thin]"><TabsList>{sections.map(([value, label, Icon]) => <TabsTrigger key={value} value={value} className="gap-2"><Icon className="size-3.5" />{label}</TabsTrigger>)}</TabsList></div>
        <TabsContent value="store"><SettingsSection title="Mağaza bilgileri" description="Kamuya açık temel iletişim ve yerel ayarlar."><div className="grid gap-5 md:grid-cols-2"><AdminFormField label="Mağaza adı"><input className={adminInputClass} defaultValue="ALP Gözlük" /></AdminFormField><AdminFormField label="Varsayılan dil"><AdminSelect defaultValue="tr" ariaLabel="Varsayılan dil" options={[{ value: 'tr', label: 'Türkçe' }, { value: 'en', label: 'English' }]} /></AdminFormField><AdminFormField label="Destek e-postası"><input className={adminInputClass} type="email" placeholder="destek@alpgozluk.com" /></AdminFormField><AdminFormField label="Para birimi"><AdminSelect defaultValue="TRY" ariaLabel="Para birimi" options={[{ value: 'TRY', label: 'TRY — Türk Lirası' }]} /></AdminFormField></div></SettingsSection></TabsContent>
        <TabsContent value="payments"><IntegrationSettings title="Ödeme sağlayıcıları" icon={CreditCard} rows={['iyzico', 'GarantiPay', 'Havale / EFT']} /></TabsContent>
        <TabsContent value="shipping"><IntegrationSettings title="Kargo sağlayıcıları" icon={Truck} rows={['Aras Kargo', 'Yurtiçi Kargo', 'Mağazadan teslim']} /></TabsContent>
        <TabsContent value="storage"><SettingsSection title="Medya storage" description="Aktif sürücü backend environment dosyasından yönetilir."><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-medium">Aktif sürücü</p><p className="mt-1 text-xs text-muted-foreground">Development ortamında local filesystem</p></div><StatusBadge tone="info">Local</StatusBadge></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><ReadOnlyValue label="S3 endpoint" value="Environment ile yönetiliyor" /><ReadOnlyValue label="Bucket" value="Environment ile yönetiliyor" /></div></SettingsSection></TabsContent>
        <TabsContent value="security"><SettingsSection title="Yönetim güvenliği" description="Kritik ayarlar backend tarafından zorunlu kılınır."><div className="divide-y divide-border">{[['İki faktörlü doğrulama', 'ADMIN_2FA_ENABLED ile yönetilir', true], ['Audit log', 'Kritik işlemler kaydedilir', true], ['IP izin listesi', 'Henüz yapılandırılmadı', false]].map(([title, description, checked]) => <label key={title} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"><span><span className="block text-sm font-medium">{title}</span><span className="mt-1 block text-xs text-muted-foreground">{description}</span></span><input type="checkbox" defaultChecked={checked} disabled className="size-4 accent-[var(--primary)]" /></label>)}</div><Accordion type="single" collapsible className="mt-5 rounded-xl border border-border px-4"><AccordionItem value="totp"><AccordionTrigger>TOTP hangi uygulamalarla çalışır?</AccordionTrigger><AccordionContent>Google Authenticator, Microsoft Authenticator, 1Password, Authy ve standart TOTP üreten diğer uygulamalar kullanılabilir.</AccordionContent></AccordionItem><AccordionItem value="recovery"><AccordionTrigger>Kurtarma kodları nerede tutulur?</AccordionTrigger><AccordionContent>Kodların kendisi saklanmaz; backend yalnız güvenli hash değerlerini tutar ve her kod bir kez kullanılabilir.</AccordionContent></AccordionItem></Accordion></SettingsSection></TabsContent>
      </Tabs>
    </>
  );
}

function SettingsSection({ title, description, children }) {
  return <section className="w-full max-w-5xl rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(16,35,61,0.03)] sm:p-6"><div className="mb-6 border-b border-border pb-5"><h2 className="text-base font-semibold">{title}</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p></div>{children}</section>;
}

function ReadOnlyValue({ label, value }) {
  return <div className="rounded-xl border border-border bg-muted/45 p-4"><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-2 text-sm">{value}</p></div>;
}

function IntegrationSettings({ title, icon: Icon, rows }) {
  const [enabled, setEnabled] = useState({});
  return <SettingsSection title={title} description="Servis durumları yapılandırma tamamlandığında aktif edilebilir."><div className="divide-y divide-border">{rows.map((row) => <div key={row} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"><span className="grid size-10 place-items-center rounded-xl border border-border bg-muted/55"><Icon className="size-4" /></span><div className="min-w-0 flex-1"><p className="text-sm font-medium">{row}</p><p className="mt-1 text-xs text-muted-foreground">{enabled[row] ? 'Etkinleştirmeye hazır' : 'Bağlantı kurulmadı'}</p></div><Dialog><DialogTrigger asChild><AdminButton size="sm" variant="secondary"><KeyRound className="size-3.5" />Yapılandır</AdminButton></DialogTrigger><DialogContent><DialogHeader><DialogTitle>{row} yapılandırması</DialogTitle><DialogDescription>Secret değerlerini panelde saklamıyoruz. İlgili environment anahtarlarını sunucuda tanımladıktan sonra bağlantıyı doğrulayın.</DialogDescription></DialogHeader><AdminFormField label="Webhook adresi"><input readOnly className={adminInputClass} value="Backend kurulunca oluşturulacak" /></AdminFormField><DialogFooter><DialogClose asChild><AdminButton variant="secondary">Kapat</AdminButton></DialogClose><AdminButton onClick={() => setEnabled((current) => ({ ...current, [row]: true }))}>Yapılandırmayı işaretle</AdminButton></DialogFooter></DialogContent></Dialog></div>)}</div></SettingsSection>;
}
