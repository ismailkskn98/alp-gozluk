import { Plus } from 'lucide-react';
import AdminPageHeader from './page-header';

export default function ModulePlaceholder({ title, description, actionLabel = 'Yeni ekle' }) {
  return <><AdminPageHeader title={title} description={description} actions={<button className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-white"><Plus className="size-4" />{actionLabel}</button>} /><div className="rounded-lg border border-border bg-white"><div className="grid grid-cols-[1.6fr_1fr_1fr_auto] gap-4 border-b border-border bg-muted/60 px-4 py-3 text-xs font-medium text-muted-foreground"><span>Kayıt</span><span>Durum</span><span>Güncelleme</span><span>İşlem</span></div><div className="px-5 py-14 text-center"><p className="font-medium">Henüz kayıt bulunmuyor</p><p className="mt-2 text-sm text-muted-foreground">İlk kaydı eklediğinizde burada listelenecek.</p></div></div></>;
}
