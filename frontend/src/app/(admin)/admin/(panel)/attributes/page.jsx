import AdminPageHeader from '@/components/admin/page-header';
import CatalogResourceManager from '@/components/admin/catalog-resource-manager';

export default function Page() {
  return <><AdminPageHeader title="Özellikler ve filtreler" description="Ürün ve varyant düzeyindeki filtre gruplarını yönetin." /><div className="space-y-10"><CatalogResourceManager compact resource="attribute-groups" title="Özellik grupları" description="Ürün tipi, materyal, form, cam özelliği, renk ve ölçü grupları." /><CatalogResourceManager compact resource="attribute-values" title="Özellik değerleri" description="Filtrelerde ve ürün varyantlarında kullanılacak değerler." /></div></>;
}
