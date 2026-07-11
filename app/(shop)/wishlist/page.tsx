// app/(shop)/wishlist/page.tsx

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getWishlist } from "@/services/wishlist.service";
import { ProductCard } from "@/components/product/ProductCard";

export default async function WishlistPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const wishlist = await getWishlist(session.user.id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Wishlist Saya</h1>

      {wishlist.length === 0 ? (
        <p className="text-gray-500">Belum ada produk di wishlist kamu.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {wishlist.map((item) => (
            <ProductCard
              key={item.id}
              slug={item.product.slug}
              name={item.product.name}
              price={item.product.price}
              imageUrl={item.product.images[0]?.url}
              storeName={item.product.seller.storeName}
            />
          ))}
        </div>
      )}
    </div>
  );
}