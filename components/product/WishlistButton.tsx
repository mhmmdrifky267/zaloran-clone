// components/product/WishlistButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function WishlistButton({
  productId,
  initialWishlisted = false,
}: {
  productId: string;
  initialWishlisted?: boolean;
}) {
  const router = useRouter();
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [loading, setLoading] = useState(false);

  async function handleToggle(e: React.MouseEvent) {
    e.preventDefault(); // cegah <Link> pembungkus ikut ter-klik (kalau dipasang di ProductCard)
    e.stopPropagation();

    setLoading(true);
    const res = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    setLoading(false);

    if (res.status === 401) {
      router.push("/login");
      return;
    }

    if (res.ok) {
      const data = await res.json();
      setWishlisted(data.wishlisted);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      aria-label={wishlisted ? "Hapus dari wishlist" : "Tambah ke wishlist"}
      className={`flex h-8 w-8 items-center justify-center rounded-full border bg-white ${
        wishlisted ? "text-red-500" : "text-gray-400"
      }`}
    >
      {wishlisted ? "♥" : "♡"}
    </button>
  );
}