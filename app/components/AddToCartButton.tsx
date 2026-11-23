"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "@/app/components/CartProvider";

type AddToCartButtonProps = {
  productId: number;
  className?: string;
  disabled?: boolean;
};

export default function AddToCartButton({
  productId,
  className = "",
  disabled = false,
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function handleClick() {
    addItem(productId);
    setAdded(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={className}
    >
      {added ? "Added to Cart" : "Add to Cart"}
    </button>
  );
}
