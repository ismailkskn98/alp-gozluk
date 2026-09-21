import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';

export default function CategoryCard({ title, description, action, href, image, imagePosition }) {
  return (
    <Link
      href={href}
      className="group relative flex min-h-[clamp(30rem,48vw,45rem)] flex-col overflow-hidden bg-[#2b2826] p-[clamp(1.5rem,3vw,3rem)] text-white"
    >
      <Image
        src={image}
        alt=""
        fill
        sizes="(min-width: 768px) 46vw, 92vw"
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]"
        style={{ objectPosition: imagePosition }}
      />
      <span className="absolute inset-0 bg-gradient-to-b from-black/52 via-black/8 to-black/55" />
      <div className="relative z-10 max-w-sm">
        <h3 className="text-[clamp(2.35rem,4vw,4.5rem)] font-normal leading-[0.96] tracking-[-0.045em]">{title}</h3>
        <p className="mt-5 max-w-xs text-sm leading-6 text-white/82">{description}</p>
      </div>
      <span className="relative z-10 mt-auto inline-flex w-fit items-center gap-2 border-b border-white/70 pb-1 text-sm font-medium">
        {action}<ArrowUpRight className="size-4" />
      </span>
    </Link>
  );
}
