import Link from "next/link";
import { getAllProducts, getAllCategories } from "@/lib/adminData";
import { ProductTable } from "@/components/admin/ProductTable";

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([getAllProducts(), getAllCategories()]);

  return (
    <div>
      <div className="admin-header-row">
        <h1 className="admin-title">Produtos</h1>
        <Link href="/admin/products/new" className="admin-btn">
          + Novo produto
        </Link>
      </div>
      <ProductTable products={products} categories={categories} />
    </div>
  );
}
