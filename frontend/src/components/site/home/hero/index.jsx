import HeroContent from './content';
import HeroContentMobile from './content-mobile';
import HeroVideo from './video';

export default function Hero({ copy }) {
  return (
    <section aria-labelledby="home-hero-title" className="grid-container bg-white">
      <div className="home-hero-media fluid relative min-h-[clamp(25rem,64svh,34rem)] overflow-hidden bg-[#777a7b] md:min-h-[calc(100svh-3.5rem)]">
        <HeroVideo label={copy.videoLabel} pauseLabel={copy.pauseVideo} playLabel={copy.playVideo} />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,20,23,0.58)_0%,rgba(17,20,23,0.14)_54%,rgba(17,20,23,0.02)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
        <HeroContent copy={copy} />
      </div>
      <HeroContentMobile copy={copy} />
    </section>
  );
}
