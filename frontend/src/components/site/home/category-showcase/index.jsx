import SectionHeading from '../section-heading';
import CategoryCard from './category-card';

export default function CategoryShowcase({ copy }) {
  return (
    <section className="home-deferred-section grid-container pb-[clamp(5rem,11vw,10rem)]" aria-labelledby="home-categories-title">
      <div>
        <SectionHeading title={<span id="home-categories-title">{copy.title}</span>} description={copy.description} />
        <div className="mt-[clamp(2.5rem,5vw,5rem)] grid gap-3 md:grid-cols-2">
          <CategoryCard
            title={copy.sunglasses}
            description={copy.sunglassesCopy}
            action={copy.action}
            href="/category/sunglasses"
            image="/mockup-gozlukler/2@4x.png"
            imagePosition="center"
          />
          <CategoryCard
            title={copy.darkFrames}
            description={copy.darkFramesCopy}
            action={copy.darkFramesAction}
            href="/shop"
            image="/mockup-gozlukler/3@4x.png"
            imagePosition="58% center"
          />
        </div>
      </div>
    </section>
  );
}
