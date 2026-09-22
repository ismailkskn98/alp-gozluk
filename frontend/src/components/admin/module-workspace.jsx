'use client';

import { CalendarDays, Check, ChevronDown, Download, Ellipsis, Filter, MoreHorizontal, Plus, Search, SlidersHorizontal, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import AdminPageHeader from '@/components/admin/page-header';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/admin/ui/accordion';
import AdminAlert from '@/components/admin/ui/alert';
import { AdminButton } from '@/components/admin/ui/button';
import AdminCalendar from '@/components/admin/ui/calendar';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from '@/components/admin/ui/context-menu';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/admin/ui/dialog';
import AdminDrawer from '@/components/admin/ui/drawer';
import AdminDropzone from '@/components/admin/ui/dropzone';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/admin/ui/dropdown-menu';
import { adminInputClass, AdminFormField } from '@/components/admin/ui/form-field';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/admin/ui/popover';
import ScrollArea from '@/components/admin/ui/scroll-area';
import StatusBadge from '@/components/admin/ui/status-badge';
import { AdminSelect } from '@/components/admin/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/admin/ui/tabs';
import { moduleConfigs } from './module-config';

export default function AdminModuleWorkspace({ module }) {
  const config = moduleConfigs[module];
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [date, setDate] = useState(new Date());
  const actionIcon = config.readonly ? Download : Plus;
  const ActionIcon = actionIcon;

  return (
    <>
      <AdminPageHeader eyebrow={config.eyebrow} title={config.title} description={config.description} actions={
        <Dialog><DialogTrigger asChild><AdminButton><ActionIcon className="size-4" />{config.action}</AdminButton></DialogTrigger><CreateDialog config={config} /></Dialog>
      } />
      <div className="space-y-4">
        <AdminAlert title="Arayüz önizleme verisi" variant="info">Aşağıdaki tek kayıt tablo, menü ve durum davranışlarını göstermek içindir; veritabanına yazılmaz.</AdminAlert>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-full overflow-x-auto"><Tabs defaultValue="all"><TabsList><TabsTrigger value="all">Tümü</TabsTrigger><TabsTrigger value="active">Aktif</TabsTrigger><TabsTrigger value="draft">Taslak</TabsTrigger></TabsList></Tabs></div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative min-w-0 sm:w-64"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><span className="sr-only">{config.title} içinde ara</span><input className={`${adminInputClass} pl-9`} placeholder="Ara…" /></label>
            <Popover><PopoverTrigger asChild><AdminButton variant="secondary"><CalendarDays className="size-4" />{date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</AdminButton></PopoverTrigger><PopoverContent className="w-auto p-0"><AdminCalendar selected={date} onSelect={setDate} /></PopoverContent></Popover>
            <Popover><PopoverTrigger asChild><AdminButton variant="secondary"><Filter className="size-4" />Filtre</AdminButton></PopoverTrigger><PopoverContent align="end" className="w-[min(92vw,18rem)]"><div className="flex items-center justify-between"><p className="text-sm font-semibold">Filtreler</p><button type="button" className="text-xs font-medium text-primary">Temizle</button></div><div className="mt-4 space-y-4"><AdminFormField label="Durum"><AdminSelect defaultValue="all" ariaLabel="Durum filtresi" options={[{ value: 'all', label: 'Tümü' }, { value: 'active', label: 'Aktif' }, { value: 'draft', label: 'Taslak' }]} /></AdminFormField><AdminButton className="w-full"><SlidersHorizontal className="size-4" />Uygula</AdminButton></div></PopoverContent></Popover>
            <DropdownMenu><DropdownMenuTrigger asChild><AdminButton variant="secondary" aria-label="Diğer seçenekler"><MoreHorizontal className="size-4" /></AdminButton></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuLabel>Görünüm</DropdownMenuLabel><DropdownMenuItem><Check className="size-4" />Yoğun tablo</DropdownMenuItem><DropdownMenuItem>Dışa aktar</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem>Sütunları düzenle</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
          </div>
        </div>

        {config.calendar ? <div className="grid gap-4 lg:grid-cols-[19rem_1fr]"><AdminCalendar selected={date} onSelect={setDate} className="w-full shadow-none" /><div className="rounded-xl border border-border bg-card p-5"><p className="text-sm font-semibold">{date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</p><p className="mt-2 text-xs text-muted-foreground">Bu güne planlanmış aktif kampanya bulunmuyor.</p></div></div> : null}

        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] border-collapse text-left">
              <thead className="border-b border-border bg-muted/50"><tr>{config.columns.map((column) => <th key={column} className="px-4 py-3 text-[0.69rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{column}</th>)}<th className="w-14 px-4 py-3"><span className="sr-only">İşlemler</span></th></tr></thead>
              <tbody><ContextMenu><ContextMenuTrigger asChild><tr className="group border-b border-border transition-colors hover:bg-muted/35">{config.row.map((value, index) => <td key={`${value}-${index}`} className="px-4 py-4 text-sm">{index === config.row.length - 1 ? <StatusBadge tone={config.tone}>{value}</StatusBadge> : value}</td>)}<td className="px-4 py-4"><DropdownMenu><DropdownMenuTrigger asChild><button type="button" className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Kayıt işlemleri"><Ellipsis className="size-4" /></button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => setDrawerOpen(true)}>Detayları görüntüle</DropdownMenuItem><DropdownMenuItem disabled={config.readonly}>Düzenle</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem className="text-danger" disabled title="Backend silme akışı bağlandığında etkinleşecek">Silme henüz kullanılamıyor</DropdownMenuItem></DropdownMenuContent></DropdownMenu></td></tr></ContextMenuTrigger><ContextMenuContent><ContextMenuItem onSelect={() => setDrawerOpen(true)}>Detayları aç</ContextMenuItem><ContextMenuItem>Kopyala</ContextMenuItem><ContextMenuSeparator /><ContextMenuItem className="text-danger" disabled><Trash2 className="size-4" />Silme henüz kullanılamıyor</ContextMenuItem></ContextMenuContent></ContextMenu></tbody>
            </table>
          </div>
          <footer className="flex flex-col gap-3 border-t border-border px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><span>1 arayüz örneği · gerçek kayıt yok</span><div className="flex items-center gap-2"><button type="button" disabled className="rounded-md border border-border px-2.5 py-1.5 disabled:opacity-40">Önceki</button><span className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground">1</span><button type="button" disabled className="rounded-md border border-border px-2.5 py-1.5 disabled:opacity-40">Sonraki</button></div></footer>
        </section>

        <section className="rounded-2xl border border-border bg-card px-5"><Accordion type="single" collapsible><AccordionItem value="help"><AccordionTrigger>Bu modül nasıl çalışacak?</AccordionTrigger><AccordionContent>Form verileri backend’de doğrulanacak, rol ve izin kontrolünden geçecek; başarılı işlemden sonra audit log kaydı ve ilgili Redis cache invalidation işlemi oluşturulacak.</AccordionContent></AccordionItem></Accordion></section>
      </div>

      <AdminDrawer open={drawerOpen} onOpenChange={setDrawerOpen} ariaLabel={`${config.singular} detayları`}>
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-5"><div><p className="text-xs text-muted-foreground">Kayıt detayı</p><p className="text-sm font-semibold">{config.row[0]}</p></div><button type="button" onClick={() => setDrawerOpen(false)} aria-label="Kapat" className="grid size-9 place-items-center rounded-lg hover:bg-sidebar-accent"><X className="size-4" /></button></div>
        <ScrollArea className="min-h-0 flex-1"><div className="space-y-6 p-5"><StatusBadge tone={config.tone}>{config.row.at(-1)}</StatusBadge>{config.columns.map((column, index) => <div key={column} className="border-b border-border pb-3"><p className="text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{column}</p><p className="mt-2 text-sm">{config.row[index]}</p></div>)}</div></ScrollArea>
      </AdminDrawer>
    </>
  );
}

function CreateDialog({ config }) {
  return <DialogContent><DialogHeader><DialogTitle>{config.action}</DialogTitle><DialogDescription>{config.readonly ? 'Seçilen tarih aralığındaki kayıtları güvenli biçimde dışa aktarın.' : `Yeni ${config.singular} için temel bilgileri girin. Backend entegrasyonu tamamlanmadan kayıt gönderilmez.`}</DialogDescription></DialogHeader>{config.dropzone ? <AdminDropzone className="mt-5" /> : <div className="mt-5 space-y-4"><AdminFormField label="Başlık" required><input className={adminInputClass} placeholder={`${config.singular} başlığı`} /></AdminFormField><AdminFormField label="Açıklama" hint="İsteğe bağlı"><textarea className={`${adminInputClass} min-h-24 py-2.5`} /></AdminFormField></div>}<DialogFooter><DialogClose asChild><AdminButton variant="secondary">Vazgeç</AdminButton></DialogClose><AdminButton disabled>{config.readonly ? 'Dışa aktarma API’si bekleniyor' : 'API entegrasyonu bekleniyor'}</AdminButton></DialogFooter></DialogContent>;
}
