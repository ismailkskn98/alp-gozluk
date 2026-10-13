import AdminPageHeader from '@/components/admin/page-header';
import ProductForm from '@/components/admin/product-form';

export default async function EditProductPage({ params }) {
  const { id } = await params;
  return (
    <>
      <AdminPageHeader
        eyebrow="Katalog / Ürünler"
        title="Ürünü düzenle"
        description="Ürün bilgilerini, katalog ilişkilerini, varyantlarını ve yayın durumunu güncelleyin."
      />
      <ProductForm productId={id} />
    </>
  );
}
