export default function FrameIllustration({ variant = 'optical', className, label }) {
  const commonProps = {
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    vectorEffect: 'non-scaling-stroke',
  };

  return (
    <svg
      viewBox="0 0 800 320"
      className={className}
      role={label ? 'img' : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
    >
      {variant === 'sun' ? (
        <>
          <path d="M82 112C88 83 111 68 149 68h170c35 0 55 18 50 50l-8 49c-7 45-37 70-88 70H165c-47 0-73-23-80-68l-7-37c-1-7 0-14 4-20Z" fill="currentColor" opacity="0.13" />
          <path d="M431 118c-5-32 15-50 50-50h170c38 0 61 15 67 44l4 20-7 37c-7 45-33 68-80 68H527c-51 0-81-25-88-70l-8-49Z" fill="currentColor" opacity="0.13" />
          <path {...commonProps} strokeWidth="14" d="M76 102c9-30 34-45 73-45h170c44 0 67 24 60 65l-8 49c-8 50-42 77-98 77H165c-53 0-84-27-91-77l-6-39c-3-18 0-28 8-30Zm648 0c-9-30-34-45-73-45H481c-44 0-67 24-60 65l8 49c8 50 42 77 98 77h108c53 0 84-27 91-77l6-39c3-18 0-28-8-30Z" />
          <path {...commonProps} strokeWidth="14" d="M379 116c12-9 27-14 45-14s33 5 45 14M70 108 24 84m706 24 46-24" />
        </>
      ) : (
        <>
          <path {...commonProps} strokeWidth="13" d="M75 93c8-25 29-38 63-38h177c43 0 66 22 62 61l-7 61c-5 47-34 71-87 71H163c-50 0-78-24-86-69l-9-54c-3-15 0-25 7-32Zm650 0c-8-25-29-38-63-38H485c-43 0-66 22-62 61l7 61c5 47 34 71 87 71h120c50 0 78-24 86-69l9-54c3-15 0-25-7-32Z" />
          <path {...commonProps} strokeWidth="13" d="M377 116c13-12 29-18 47-18s34 6 47 18M69 108 24 87m707 21 45-21" />
        </>
      )}
    </svg>
  );
}
