import ProductForm from "@/app/admin/components/ProductForm";
import { listCategories } from "@/lib/catalog";

export const metadata = {
  title: "Add Product",
};

export default async function NewProductPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-900 sm:text-3xl">Add Product</h1>
        <p className="mt-2 text-cocoa-700">
          Add a new item to your stationery and book catalogue.
        </p>
      </div>
      <ProductForm categories={await listCategories()} />
    </div>
  );
}
