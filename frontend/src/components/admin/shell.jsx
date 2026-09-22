'use client';

import { useCallback, useEffect, useState } from 'react';
import AdminDrawer from './ui/drawer';
import AdminSidebar from './sidebar';
import AdminTopbar from './topbar';
import CommandPalette from './command-palette';

export default function AdminShell({ user, children, initialCompact = false }) {
  const [compact, setCompact] = useState(initialCompact);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  const updateCompact = useCallback((value) => {
    setCompact(value);
    document.cookie = `alp_admin_sidebar=${value ? 'compact' : 'expanded'}; path=/; max-age=31536000; samesite=lax`;
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen((current) => !current);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="flex min-h-svh bg-background">
      <aside className="sticky top-0 hidden h-svh shrink-0 border-r border-sidebar-border transition-[width] duration-300 md:block" style={{ width: compact ? 'var(--admin-sidebar-compact)' : 'var(--admin-sidebar-width)' }}>
        <AdminSidebar user={user} compact={compact} onCompactChange={updateCompact} onSearch={() => setCommandOpen(true)} />
      </aside>
      <div className="min-w-0 flex-1">
        <AdminTopbar user={user} onMenuOpen={() => setMobileOpen(true)} onSearch={() => setCommandOpen(true)} />
        <main className="grid-container min-h-[calc(100svh-3.5rem)]"><div className="w-full px-[clamp(1rem,2.2vw,2rem)] py-[clamp(1.25rem,2.5vw,2.25rem)]">{children}</div></main>
      </div>
      <AdminDrawer open={mobileOpen} onOpenChange={setMobileOpen} side="left" ariaLabel="Yönetim navigasyonu"><AdminSidebar mobile user={user} onSearch={() => { setMobileOpen(false); setCommandOpen(true); }} onNavigate={() => setMobileOpen(false)} /></AdminDrawer>
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} user={user} />
    </div>
  );
}
