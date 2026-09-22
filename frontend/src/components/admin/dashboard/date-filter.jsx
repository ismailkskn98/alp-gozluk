'use client';

import { CalendarDays } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

export default function DashboardDateFilter() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium transition-colors hover:border-border-strong">
          <CalendarDays className="size-4 text-muted-foreground" />
          Son 30 gün
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(92vw,22rem)]">
        <p className="text-sm font-semibold">Rapor aralığı</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">Tarih aralığı rapor API’si bağlandığında grafik ve kartları birlikte filtreleyecek.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-medium">Başlangıç<input type="date" className="admin-field mt-1.5 text-sm" defaultValue="2026-08-23" /></label>
          <label className="text-xs font-medium">Bitiş<input type="date" className="admin-field mt-1.5 text-sm" defaultValue="2026-09-21" /></label>
        </div>
        <button type="button" disabled className="mt-4 h-9 w-full rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-55">Rapor API’si bekleniyor</button>
      </PopoverContent>
    </Popover>
  );
}
