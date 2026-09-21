import { ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/navigation";

export default function HeroContent({ copy }) {
  return (
    <div className="home-hero-copy absolute inset-0 z-10 hidden text-white md:block">
      <div className="grid-container h-full">
        <div className="flex h-full items-end py-[clamp(3.25rem,8vh,6.5rem)]">
          <div className="max-w-[37rem]">
            <h1 id="home-hero-title" className="max-w-[10.5ch] text-balance text-[clamp(3.1rem,5.2vw,6rem)] font-normal leading-[0.99] tracking-[-0.04em]">
              {copy.title}
            </h1>
            <p className="mt-[clamp(1.75rem,3vh,2.25rem)] max-w-lg text-[clamp(0.95rem,1.05vw,1.075rem)] leading-[1.7] text-white/88">{copy.description}</p>
            <div className="mt-[clamp(2rem,3.5vh,2.75rem)] flex flex-wrap gap-3">
              <Link href="/shop" className="inline-flex h-11 items-center gap-2 bg-white px-5 text-sm font-medium text-[#232323] transition-colors duration-200 hover:bg-[#f1f1f1]">
                {copy.primaryAction}
                <ArrowUpRight className="size-4" />
              </Link>
              <Link
                href="/guide"
                className="inline-flex h-11 items-center border border-white/55 bg-black/10 px-5 text-sm font-medium text-white backdrop-blur-sm transition-colors duration-200 hover:bg-white hover:text-[#232323]"
              >
                {copy.secondaryAction}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
