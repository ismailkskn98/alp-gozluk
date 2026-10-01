import { cn } from '@/lib/utils';

export default function CheckoutFormField({
  label,
  error,
  hint,
  htmlFor,
  className,
  children,
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-xs font-medium text-[#263630]">
          {label}
        </label>
        {hint ? <span className="text-xs text-[#7b8580]">{hint}</span> : null}
      </div>
      <div className="mt-1.5">{children}</div>
      {error ? (
        <p id={`${htmlFor}-error`} className="mt-1.5 text-xs text-[#a53e3e]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
