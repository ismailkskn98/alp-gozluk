import {
  BadgePercent, Boxes, ChartNoAxesCombined, ClipboardList, FileText,
  FolderTree, ImageIcon, LayoutDashboard, ListTree, Package, Settings, ShieldCheck,
  ShoppingBag, SlidersHorizontal, Tags, Users, Warehouse,
} from 'lucide-react';

export const adminNavigationGroups = [
  {
    label: 'Operasyon',
    items: [
      { label: 'Genel bakış', href: '/admin', icon: LayoutDashboard },
      { label: 'Siparişler', href: '/admin/orders', icon: ShoppingBag, badge: '0' },
      { label: 'Müşteriler', href: '/admin/customers', icon: Users },
    ],
  },
  {
    label: 'Katalog',
    items: [
      { label: 'Ürünler', href: '/admin/products', icon: Package },
      { label: 'Kategoriler', href: '/admin/categories', icon: FolderTree },
      { label: 'Koleksiyonlar', href: '/admin/collections', icon: Boxes },
      { label: 'Hedef kitleler', href: '/admin/audiences', icon: Users },
      { label: 'Özellikler', href: '/admin/attributes', icon: SlidersHorizontal },
      { label: 'Markalar', href: '/admin/brands', icon: Tags },
      { label: 'Mega menü', href: '/admin/navigation', icon: ListTree },
      { label: 'Stok', href: '/admin/inventory', icon: Warehouse },
      { label: 'Medya', href: '/admin/media', icon: ImageIcon },
    ],
  },
  {
    label: 'Büyüme',
    items: [
      { label: 'Kampanyalar', href: '/admin/campaigns', icon: BadgePercent },
      { label: 'İçerik', href: '/admin/content', icon: FileText },
      { label: 'Raporlar', href: '/admin/reports', icon: ChartNoAxesCombined },
    ],
  },
  {
    label: 'Sistem',
    items: [
      { label: 'Kullanıcılar', href: '/admin/users', icon: Users, superAdminOnly: true },
      { label: 'Roller', href: '/admin/roles', icon: ShieldCheck, superAdminOnly: true },
      { label: 'Audit log', href: '/admin/audit-logs', icon: ClipboardList },
      { label: 'Ayarlar', href: '/admin/settings', icon: Settings },
    ],
  },
];

const editorPaths = new Set([
  '/admin', '/admin/products', '/admin/categories', '/admin/collections', '/admin/audiences',
  '/admin/attributes', '/admin/brands', '/admin/inventory', '/admin/media', '/admin/content',
]);

export function getAdminNavigation(user) {
  const isSuperAdmin = user.roles?.includes('super_admin');
  const isEditor = user.roles?.includes('editor') && !user.roles?.includes('admin') && !isSuperAdmin;
  return adminNavigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.superAdminOnly && !isSuperAdmin) return false;
        if (isEditor) return editorPaths.has(item.href);
        return true;
      }),
    }))
    .filter((group) => group.items.length);
}

export const routeLabels = adminNavigationGroups.flatMap((group) => group.items).reduce((labels, item) => {
  labels[item.href] = item.label;
  return labels;
}, { '/admin/products/new': 'Yeni ürün' });
