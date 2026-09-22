'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const days = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pa'];

export default function AdminCalendar({ selected, onSelect, className }) {
  const initial = selected || new Date();
  const [cursor, setCursor] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1));
  const cells = useMemo(() => {
    const firstDay = (cursor.getDay() + 6) % 7;
    const count = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    return [...Array(firstDay).fill(null), ...Array.from({ length: count }, (_, index) => index + 1)];
  }, [cursor]);

  const move = (amount) => setCursor((value) => new Date(value.getFullYear(), value.getMonth() + amount, 1));
  const sameDay = (day) => selected && selected.getFullYear() === cursor.getFullYear() && selected.getMonth() === cursor.getMonth() && selected.getDate() === day;

  return (
    <div className={cn('w-[19rem] rounded-xl border border-border bg-popover p-3 text-popover-foreground shadow-xl', className)}>
      <div className="flex items-center justify-between px-1 pb-3">
        <button type="button" onClick={() => move(-1)} aria-label="Önceki ay" className="grid size-8 place-items-center rounded-lg hover:bg-muted"><ChevronLeft className="size-4" /></button>
        <p className="text-sm font-semibold">{months[cursor.getMonth()]} {cursor.getFullYear()}</p>
        <button type="button" onClick={() => move(1)} aria-label="Sonraki ay" className="grid size-8 place-items-center rounded-lg hover:bg-muted"><ChevronRight className="size-4" /></button>
      </div>
      <div className="grid grid-cols-7 text-center text-[0.65rem] font-semibold text-muted-foreground">{days.map((day) => <span key={day} className="py-1.5">{day}</span>)}</div>
      <div className="grid grid-cols-7 gap-1">{cells.map((day, index) => day ? <button key={day} type="button" aria-pressed={sameDay(day)} onClick={() => onSelect?.(new Date(cursor.getFullYear(), cursor.getMonth(), day))} className="aspect-square rounded-lg text-xs hover:bg-muted aria-pressed:bg-primary aria-pressed:text-primary-foreground">{day}</button> : <span key={`blank-${index}`} />)}</div>
    </div>
  );
}
