import { getTranslations } from 'next-intl/server';
import CategoryShowcase from './category-showcase';
import FeaturedProducts from './featured-products';
import FrameStory from './frame-story';
import Hero from './hero';
import ServiceStrip from './service-strip';

export default async function Home({ locale }) {
  const t = await getTranslations('Home');

  const hero = {
    title: t('hero.title'),
    description: t('hero.description'),
    primaryAction: t('hero.primaryAction'),
    secondaryAction: t('hero.secondaryAction'),
    videoLabel: t('hero.videoLabel'),
    pauseVideo: t('hero.pauseVideo'),
    playVideo: t('hero.playVideo'),
  };

  const featured = {
    title: t('featured.title'),
    description: t('featured.description'),
    action: t('featured.action'),
    emptyTitle: t('featured.emptyTitle'),
    emptyDescription: t('featured.emptyDescription'),
    explore: t('featured.explore'),
  };

  const categories = {
    title: t('categories.title'),
    description: t('categories.description'),
    sunglasses: t('categories.sunglasses'),
    sunglassesCopy: t('categories.sunglassesCopy'),
    darkFrames: t('categories.darkFrames'),
    darkFramesCopy: t('categories.darkFramesCopy'),
    action: t('categories.action'),
    darkFramesAction: t('categories.darkFramesAction'),
  };

  const frameStory = {
    title: t('frameStory.title'),
    description: t('frameStory.description'),
    action: t('frameStory.action'),
    visualLabel: t('frameStory.visualLabel'),
    points: [
      [t('frameStory.points.selection'), t('frameStory.points.selectionCopy')],
      [t('frameStory.points.fit'), t('frameStory.points.fitCopy')],
      [t('frameStory.points.comfort'), t('frameStory.points.comfortCopy')],
      [t('frameStory.points.support'), t('frameStory.points.supportCopy')],
    ],
  };

  const services = [
    [t('services.guide'), t('services.guideCopy')],
    [t('services.secure'), t('services.secureCopy')],
    [t('services.support'), t('services.supportCopy')],
  ];

  return (
    <div className="overflow-clip bg-white text-[#232323]">
      <Hero copy={hero} />
      <FeaturedProducts locale={locale} copy={featured} />
      <CategoryShowcase copy={categories} />
      <FrameStory copy={frameStory} />
      <ServiceStrip services={services} />
    </div>
  );
}
