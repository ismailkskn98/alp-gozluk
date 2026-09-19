export default function PageIntro({ eyebrow, title, description }) {
  return (
    <section className="grid-container border-b border-border bg-white py-16 sm:py-20">
      <div>
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p> : null}
        <h1 className="display-serif mt-3 max-w-3xl text-balance text-5xl leading-[0.95] tracking-[-0.03em] sm:text-6xl">{title}</h1>
        {description ? <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">{description}</p> : null}
      </div>
    </section>
  );
}
