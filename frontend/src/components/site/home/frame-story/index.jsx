import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/navigation";

export default function FrameStory({ copy }) {
  return (
    <section className="home-deferred-section grid-container bg-[#f4f5f6] py-[clamp(4.5rem,9vw,8rem)]" aria-labelledby="frame-story-title">
      <div>
        <div className="grid items-end gap-6 md:grid-cols-[minmax(0,1fr)_minmax(18rem,0.48fr)]">
          <h2 id="frame-story-title" className="max-w-[18ch] text-balance text-[clamp(2.4rem,4.8vw,5.5rem)] font-normal leading-[0.92] tracking-[-0.06em]">
            {copy.title}
          </h2>
          <div className="md:justify-self-end">
            <p className="max-w-md text-sm leading-6 text-[#666a70]">{copy.description}</p>
            <Link href="/guide" className="mt-5 inline-flex items-center gap-2 border-b border-[#232323] pb-1 text-sm font-medium">
              {copy.action}
              <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </div>

        <div className="mt-[clamp(2.5rem,5vw,5rem)] bg-white">
          <div className="relative min-h-[clamp(28rem,52vw,46rem)] overflow-hidden border-b border-black/8 bg-[#d8cbb9]">
            <Image src="/mockup-gozlukler/16@9x.png" alt={copy.visualLabel} fill sizes="(max-width: 768px) 100vw, 92vw" quality={90} className="object-cover object-[center_76%]" />
            <span className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/22 to-transparent" />
            <span className="absolute left-5 top-5 text-xs text-white/85">ALP / Daily frame study</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4">
            {copy.points.map(([title, description], index) => (
              <article key={title} className={`min-h-36 p-5 ${index > 0 ? "border-t border-black/8 sm:border-l lg:border-t-0" : ""} ${index === 2 ? "sm:border-l-0 lg:border-l" : ""}`}>
                <h3 className="text-sm font-medium">{title}</h3>
                <p className="mt-3 max-w-[17rem] text-xs leading-5 text-[#74777b]">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
