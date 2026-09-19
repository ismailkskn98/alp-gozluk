export default function AdminPageHeader({ eyebrow = 'Yönetim', title, description, actions }) {
  return <header className="mb-8 flex flex-col gap-5 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{eyebrow}</p><h1 className="mt-2 text-2xl font-semibold tracking-[-0.025em]">{title}</h1>{description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}</div>{actions ? <div className="flex gap-2">{actions}</div> : null}</header>;
}
