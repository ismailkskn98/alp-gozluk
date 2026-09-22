'use client';

import { useIsPresent } from 'motion/react';

export default function PresenceGate({ children }) {
  const isPresent = useIsPresent();
  return children({
    isPresent,
    gate: { inert: !isPresent, style: { pointerEvents: isPresent ? 'auto' : 'none' } },
  });
}
