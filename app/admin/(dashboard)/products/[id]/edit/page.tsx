import { notFound } from "next/navigation";
import ProductForm from "@/app/admin/components/ProductForm";
import { getProductById, listCategories } from "@/lib/catalog";

type EditProductProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: EditProductProps) {
  const { id } = await params;
  const product = await getProductById(Number(id));
  return { title: product ? `Edit ${product.name}` : "Product not found" };
}

export default async function EditProductPage({ params }: EditProductProps) {
  const { id } = await params;
  const product = await getProductById(Number(id));
  if (!product) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-900 sm:text-3xl">
          Edit Product
        </h1>
        <p className="mt-2 text-cocoa-700">
          Update the details, price, image or stock level for {product.name}.
        </p>
      </div>
      <ProductForm product={product} categories={await listCategories()} />
    </div>
  );
}
