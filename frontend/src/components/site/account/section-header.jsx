export default function AccountSectionHeader({ kicker, title, description, action }) {
  return (
    <header className="flex flex-col gap-5 border-b border-[#d8ddd7] pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {kicker ? <p className="text-xs leading-5 text-[#68736f]">{kicker}</p> : null}
        <h2 className="mt-1 text-[clamp(2rem,4vw,3.15rem)] font-normal leading-none tracking-[-0.052em] text-[#172536]">
          {title}
        </h2>
        {description ? <p className="mt-3 max-w-2xl text-sm leading-6 text-[#66716d]">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
