'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import PresenceGate from './presence-gate';

const springPanel = { type: 'spring', stiffness: 420, damping: 40, mass: 0.5 };

export default function AdminDrawer({ open, onOpenChange, side = 'right', children, className, ariaLabel }) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => { if (event.key === 'Escape') onOpenChange(false); };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onOpenChange]);

  const offscreen = side === 'right' ? '100%' : '-100%';

  return (
    <AnimatePresence>
      {open ? (
        <>
          <PresenceGate key="admin-drawer-backdrop">{({ gate }) => (
            <motion.button
              type="button"
              data-admin-overlay
              aria-label="Paneli kapat"
              onClick={() => onOpenChange(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              {...gate}
              className="fixed inset-0 z-50 cursor-default bg-black/45 backdrop-blur-[2px]"
            />
          )}</PresenceGate>
          <PresenceGate key="admin-drawer-panel">{({ gate }) => (
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label={ariaLabel}
              data-admin-overlay
              initial={reduceMotion ? { opacity: 0 } : { x: offscreen }}
              animate={reduceMotion ? { opacity: 1 } : { x: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { x: offscreen }}
              transition={reduceMotion ? { duration: 0.15 } : springPanel}
              {...gate}
              className={cn('fixed inset-y-0 z-50 flex w-[min(90vw,21rem)] flex-col bg-sidebar text-sidebar-foreground shadow-2xl', side === 'right' ? 'right-0 border-l' : 'left-0 border-r', className)}
            >
              {children}
            </motion.aside>
          )}</PresenceGate>
        </>
      ) : null}
    </AnimatePresence>
  );
}
