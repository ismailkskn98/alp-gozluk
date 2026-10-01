export default function CheckoutSteps({ itemCount, labels, activeStep = 0 }) {
  const steps = [
    `${labels.cartSummary} (${itemCount})`,
    labels.deliveryAndPayment,
    labels.orderResult,
  ];

  return (
    <nav aria-label={labels.checkoutProgress}>
      <ol className="grid grid-cols-3 gap-2 sm:gap-3">
        {steps.map((step, index) => {
          const active = index === activeStep;
          const completed = index < activeStep;
          return (
            <li
              key={step}
              className={`flex min-w-0 items-center gap-2 border-b pb-2.5 ${active || completed ? 'border-foreground text-foreground' : 'border-border text-muted-foreground'}`}
              aria-current={active ? 'step' : undefined}
            >
              <span className={`grid size-6 shrink-0 place-items-center rounded-full text-[0.68rem] ${active || completed ? 'bg-foreground text-white' : 'bg-muted text-muted-foreground'}`}>
                {index + 1}
              </span>
              <span className="truncate text-[0.68rem] font-medium sm:text-xs">{step}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
