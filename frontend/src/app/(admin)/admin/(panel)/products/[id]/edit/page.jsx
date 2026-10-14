import AdminPageHeader from '@/components/admin/page-header';
import ProductForm from '@/components/admin/product-form';

export default async function EditProductPage({ params }) {
  const { id } = await params;
  return (
    <>
      <AdminPageHeader
        eyebrow="Katalog / Ürünler"
        title="Ürünü düzenle"
        description="Ürün bilgilerini, görsellerini, katalog ilişkilerini, varyantlarını ve yayın durumunu tek ekrandan yönetin."
      />
      <ProductForm productId={id} />
    </>
  );
}
