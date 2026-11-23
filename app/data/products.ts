export type Product = {
  id: number;
  name: string;
  price: number;
  icon: string;
  category: string;
  description: string;
  imageUrl?: string | null;
  sku?: string | null;
  stock?: number | null;
  isActive?: boolean;
  featured?: boolean;
};

export const categories = [
  "Books",
  "Stationery",
  "School Bags",
  "School Supplies",
] as const;

export type Category = (typeof categories)[number];

export const products: Product[] = [
  {
    id: 1,
    name: "Exercise Books",
    price: 50,
    icon: "📚",
    category: "Books",
    description: "Ruled exercise books for class and homework.",
  },
  {
    id: 2,
    name: "Ballpoint Pens",
    price: 20,
    icon: "🖊️",
    category: "Stationery",
    description: "Smooth writing pens in assorted colours.",
  },
  {
    id: 3,
    name: "Mathematical Sets",
    price: 150,
    icon: "📐",
    category: "School Supplies",
    description: "Ruler, protractor, compass and set squares.",
  },
  {
    id: 4,
    name: "School Bags",
    price: 1200,
    icon: "🎒",
    category: "School Bags",
    description: "Durable backpacks with plenty of room for books.",
  },
  {
    id: 5,
    name: "Drawing Books",
    price: 100,
    icon: "📒",
    category: "Books",
    description: "Blank pages ready for sketches and artwork.",
  },
  {
    id: 6,
    name: "Pencils",
    price: 15,
    icon: "✏️",
    category: "Stationery",
    description: "Sharpen-ready pencils for everyday writing.",
  },
  {
    id: 7,
    name: "Geometry Sets",
    price: 250,
    icon: "📏",
    category: "School Supplies",
    description: "Complete geometry kit for maths lessons.",
  },
  {
    id: 8,
    name: "Markers",
    price: 80,
    icon: "🖍️",
    category: "Stationery",
    description: "Bright markers for posters and projects.",
  },
];

export function formatPrice(amount: number): string {
  const fixed = amount.toFixed(2).replace(/\.00$/, "");
  const [whole, fraction] = fixed.split(".");
  const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `KSh ${fraction ? `${withCommas}.${fraction}` : withCommas}`;
}

export function getProduct(id: number): Product | undefined {
  return products.find((product) => product.id === id);
}

export function productsInCategory(category?: string): Product[] {
  if (!category) return products;
  return products.filter((product) => product.category === category);
}
