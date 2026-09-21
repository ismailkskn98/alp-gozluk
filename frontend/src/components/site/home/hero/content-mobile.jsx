import { ArrowUpRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';

export default function HeroContentMobile({ copy }) {
  return (
    <div className="py-[clamp(2.5rem,10vw,4rem)] md:hidden">
      <h1 className="max-w-[11ch] text-balance text-[clamp(2.65rem,12vw,4rem)] font-normal leading-[0.96] tracking-[-0.045em]">
        {copy.title}
      </h1>
      <p className="mt-6 max-w-md text-[0.95rem] leading-[1.65] text-[#666a70]">{copy.description}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/shop" className="inline-flex h-11 items-center gap-2 bg-[#232323] px-5 text-sm font-medium text-white">
          {copy.primaryAction}<ArrowUpRight className="size-4" />
        </Link>
        <Link href="/guide" className="inline-flex h-11 items-center border border-[#cfd1d3] px-5 text-sm font-medium">
          {copy.secondaryAction}
        </Link>
      </div>
    </div>
  );
}
