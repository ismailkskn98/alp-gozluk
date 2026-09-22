'use client';

import { Moon, Sun } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useAdminTheme } from '../theme-provider';

export default function ThemeToggle() {
  const { theme, setTheme } = useAdminTheme();
  const reduceMotion = useReducedMotion();
  const dark = theme === 'dark';

  function toggleTheme(event) {
    const nextTheme = dark ? 'light' : 'dark';
    const apply = () => setTheme(nextTheme);
    if (reduceMotion || !document.startViewTransition) {
      apply();
      return;
    }

    const transition = document.startViewTransition(apply);
    const x = event.clientX;
    const y = event.clientY;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    transition.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0 at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 460, easing: 'cubic-bezier(.16,1,.3,1)', pseudoElement: '::view-transition-new(root)' },
      );
    });
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="relative grid size-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
      aria-label={dark ? 'Açık temaya geç' : 'Koyu temaya geç'}
    >
      <motion.span initial={false} animate={{ rotate: dark ? 90 : 0, scale: dark ? 0 : 1 }} className="absolute"><Sun className="size-4" /></motion.span>
      <motion.span initial={false} animate={{ rotate: dark ? 0 : -90, scale: dark ? 1 : 0 }} className="absolute"><Moon className="size-4" /></motion.span>
    </button>
  );
}
