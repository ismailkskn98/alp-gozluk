export default function CheckoutSteps({ itemCount, labels }) {
  const steps = [
    `${labels.cartSummary} (${itemCount})`,
    labels.deliveryAndPayment,
    labels.orderResult,
  ];

  return (
    <nav aria-label={labels.checkoutProgress}>
      <ol className="grid grid-cols-3 gap-2 sm:gap-4">
        {steps.map((step, index) => {
          const active = index === 0;
          return (
            <li
              key={step}
              className={`flex min-w-0 items-center gap-2 border-b-2 pb-3 sm:gap-3 ${active ? 'border-foreground text-foreground' : 'border-border text-muted-foreground'}`}
              aria-current={active ? 'step' : undefined}
            >
              <span className={`grid size-7 shrink-0 place-items-center rounded-full text-xs ${active ? 'bg-foreground text-white' : 'bg-muted text-muted-foreground'}`}>
                {index + 1}
              </span>
              <span className="truncate text-[0.7rem] font-medium sm:text-sm">{step}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
