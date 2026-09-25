"use client";

import { BouncyAccordion } from "@/components/motion/bouncy-accordion";

export default function ProductSpecifications({ specifications = {}, title }) {
  const rows = Object.entries(specifications).filter(([, value]) => value);
  if (rows.length === 0) return null;

  const details = (
    <dl className="divide-y divide-black/8 border-y border-black/8">
      {rows.map(([label, value]) => (
        <div key={label} className="grid grid-cols-[minmax(7.5rem,0.8fr)_minmax(0,1.2fr)] gap-5 py-3 text-sm">
          <dt className="text-[#777b80]">{label}</dt>
          <dd className="text-right text-[#202326]">{value}</dd>
        </div>
      ))}
    </dl>
  );

  return (
    <section className="pt-5" aria-label={title}>
      <BouncyAccordion
        radius={0}
        items={[{ id: "specifications", title, description: details }]}
        classNames={{
          item: "border-b border-black/10 bg-white",
          trigger: "min-h-12 px-0",
          title: "text-sm font-normal",
          description: "text-[#202326]",
        }}
      />
    </section>
  );
}
