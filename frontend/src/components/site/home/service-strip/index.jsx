import { Headphones, ScanFace, ShieldCheck } from 'lucide-react';

const icons = [ScanFace, ShieldCheck, Headphones];

export default function ServiceStrip({ services }) {
  return (
    <section className="home-deferred-section grid-container bg-white py-[clamp(3.5rem,7vw,6rem)]">
      <div className="grid border-y border-black/10 md:grid-cols-3">
        {services.map(([title, description], index) => {
          const Icon = icons[index];
          return (
            <article key={title} className={`flex gap-4 py-6 md:px-7 ${index > 0 ? 'border-t border-black/10 md:border-l md:border-t-0' : ''}`}>
              <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0" strokeWidth={1.35} />
              <div>
                <h2 className="text-sm font-medium">{title}</h2>
                <p className="mt-1.5 max-w-xs text-xs leading-5 text-[#72767a]">{description}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
