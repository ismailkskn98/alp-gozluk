'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AdminThemeContext = createContext(null);

export function useAdminTheme() {
  const context = useContext(AdminThemeContext);
  if (!context) throw new Error('useAdminTheme yalnız AdminThemeProvider içinde kullanılabilir.');
  return context;
}

export default function AdminThemeProvider({ initialTheme, children }) {
  const [theme, setTheme] = useState(initialTheme);

  useEffect(() => {
    document.documentElement.dataset.adminTheme = theme;
    document.cookie = `alp_admin_theme=${theme}; path=/; max-age=31536000; samesite=lax`;
    return () => {
      if (document.documentElement.dataset.adminTheme === theme) {
        delete document.documentElement.dataset.adminTheme;
      }
    };
  }, [theme]);

  const value = useMemo(() => ({ theme, setTheme }), [theme]);

  return (
    <AdminThemeContext.Provider value={value}>
      <div className="admin-theme" data-theme={theme}>{children}</div>
    </AdminThemeContext.Provider>
  );
}
