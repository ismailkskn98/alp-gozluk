export default function SectionHeading({ title, description, action }) {
  return (
    <div className="grid items-end gap-5 md:grid-cols-[minmax(0,1fr)_minmax(16rem,0.48fr)]">
      <h2 className="max-w-[19ch] text-balance text-[clamp(2.15rem,4.1vw,4.75rem)] font-normal leading-[0.94] tracking-[-0.055em]">
        {title}
      </h2>
      <div className="flex flex-col items-start gap-5 md:items-end md:text-right">
        {description ? <p className="max-w-md text-sm leading-6 text-[#666a70]">{description}</p> : null}
        {action}
      </div>
    </div>
  );
}
