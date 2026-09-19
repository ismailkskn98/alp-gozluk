import PageIntro from './page-intro';

export default function ContentPage({ eyebrow, title, description, children }) {
  return (
    <>
      <PageIntro eyebrow={eyebrow} title={title} description={description} />
      <section className="grid-container py-12 sm:py-16">
        <div className="max-w-3xl space-y-6 text-base leading-7 text-foreground/75">{children}</div>
      </section>
    </>
  );
}
