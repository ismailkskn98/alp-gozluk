'use client';

import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import { ArrowDown, ArrowUp, Clock3, ExternalLink, GripVertical, Pencil, Trash2 } from 'lucide-react';
import StatusBadge from '@/components/admin/ui/status-badge';

const speedLabels = {
  5: 'Hızlı · 5 saniye',
  8: 'Dengeli · 8 saniye',
  12: 'Yavaş · 12 saniye',
};

export default function SortableAnnouncementRow({ item, index, total, disabled, onEdit, onDelete, onMove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id, disabled });

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative border-b border-border bg-card p-4 last:border-0 ${isDragging ? 'z-10 shadow-lg ring-1 ring-primary/25' : ''}`}
    >
      <div className="flex items-start gap-2 sm:gap-3">
        <button
          type="button"
          className="grid size-9 shrink-0 touch-none place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing disabled:opacity-40"
          aria-label={`${item.messageTr} duyurusunu sürükleyerek sırala`}
          disabled={disabled}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
        <span className="mt-0.5 hidden size-8 shrink-0 rounded-lg border border-black/10 sm:block" style={{ backgroundColor: item.backgroundColor }} aria-label={`Arka plan ${item.backgroundColor}`} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><p className="text-sm font-medium">{item.messageTr}</p><StatusBadge tone={item.isActive ? 'success' : 'neutral'}>{item.isActive ? 'Aktif' : 'Pasif'}</StatusBadge></div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Clock3 className="size-3" />{speedLabels[item.durationSeconds] || `${item.durationSeconds} saniyede değişir`}</span>
            {item.linkUrl ? <span className="inline-flex min-w-0 items-center gap-1"><ExternalLink className="size-3 shrink-0" /><span className="truncate">{item.linkUrl}</span></span> : null}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-1">
          <button type="button" className="grid size-8 place-items-center rounded-lg hover:bg-muted disabled:opacity-30" disabled={disabled || index === 0} onClick={() => onMove(index, index - 1)} aria-label="Bir sıra yukarı taşı"><ArrowUp className="size-3.5" /></button>
          <button type="button" className="grid size-8 place-items-center rounded-lg hover:bg-muted disabled:opacity-30" disabled={disabled || index === total - 1} onClick={() => onMove(index, index + 1)} aria-label="Bir sıra aşağı taşı"><ArrowDown className="size-3.5" /></button>
          <button type="button" className="grid size-8 place-items-center rounded-lg hover:bg-muted" onClick={() => onEdit(item)} aria-label="Duyuruyu düzenle"><Pencil className="size-3.5" /></button>
          <button type="button" className="grid size-8 place-items-center rounded-lg text-danger hover:bg-danger/8" onClick={() => onDelete(item)} aria-label="Duyuruyu sil"><Trash2 className="size-3.5" /></button>
        </div>
      </div>
    </article>
  );
}
