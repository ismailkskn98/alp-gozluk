export default function ProductSpecifications({ specifications = {}, title }) {
  const rows = Object.entries(specifications).filter(([, value]) => value);
  if (rows.length === 0) return null;

  return (
    <section className="mt-10 border-t border-black/12 pt-7" aria-labelledby="product-specifications-title">
      <h2 id="product-specifications-title" className="text-base font-medium tracking-[-0.015em]">
        {title}
      </h2>
      <dl className="mt-5 divide-y divide-black/8 border-y border-black/8">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[minmax(7.5rem,0.8fr)_minmax(0,1.2fr)] gap-5 py-3 text-sm">
            <dt className="text-[#777b80]">{label}</dt>
            <dd className="text-right text-[#202326]">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
