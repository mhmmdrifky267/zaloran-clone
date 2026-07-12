// app/(seller)/dashboard/products/new/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadButton } from "@/lib/uploadthing";

type Variant = { size: string; color: string; stock: number };
type Category = { id: string; name: string };

export default function NewProductPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [variants, setVariants] = useState<Variant[]>([
    { size: "", color: "", stock: 0 },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadCategories() {
      const res = await fetch("/api/categories");
      if (res.ok) setCategories(await res.json());
    }
    loadCategories();
  }, []);

  function addVariant() {
    setVariants([...variants, { size: "", color: "", stock: 0 }]);
  }

  function updateVariant(index: number, field: keyof Variant, value: string) {
    const next = [...variants];
    next[index] = {
      ...next[index],
      [field]: field === "stock" ? Number(value) : value,
    };
    setVariants(next);
  }

  function removeVariant(index: number) {
    setVariants(variants.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/seller/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description,
        price: Number(price),
        categoryId,
        images,
        variants,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(
        typeof data.error === "string"
          ? data.error
          : Object.values(data.error).flat().join(", ")
      );
      return;
    }

    router.push("/dashboard/products");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl py-10">
      <h1 className="mb-6 text-2xl font-bold">Tambah Produk</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="mb-1 block text-sm font-medium">
            Nama Produk
          </label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Deskripsi</label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Harga (Rp)
            </label>
            <input
              type="number"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-md border px-3 py-2"
            />
          </div>

          {/* Dropdown kategori — user pilih nama kategori aslinya, bukan ID mentah */}
          <div>
            <label className="mb-1 block text-sm font-medium">Kategori</label>
            <select
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-md border px-3 py-2"
            >
              <option value="">Pilih kategori</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ---- Upload gambar ---- */}
        <div>
          <label className="mb-1 block text-sm font-medium">
            Gambar Produk ({images.length}/5)
          </label>

          <UploadButton
            endpoint="productImage"
            onClientUploadComplete={(res) => {
              const urls = res.map((file) => file.url);
              setImages((prev) => [...prev, ...urls]);
            }}
            onUploadError={(err) => {
              setError(`Upload gagal: ${err.message}`);
            }}
          />

          <div className="mt-3 flex gap-2">
            {images.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={url}
                src={url}
                alt="Preview produk"
                className="h-20 w-20 rounded-md object-cover"
              />
            ))}
          </div>
        </div>

        {/* ---- Varian (ukuran/warna/stok) ---- */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium">Varian</label>
            <button
              type="button"
              onClick={addVariant}
              className="text-sm text-blue-600"
            >
              + Tambah Varian
            </button>
          </div>

          <div className="space-y-2">
            {variants.map((variant, index) => (
              <div key={index} className="flex gap-2">
                <input
                  placeholder="Ukuran (mis. M)"
                  value={variant.size}
                  onChange={(e) =>
                    updateVariant(index, "size", e.target.value)
                  }
                  className="flex-1 rounded-md border px-3 py-2"
                />
                <input
                  placeholder="Warna (mis. Hitam)"
                  value={variant.color}
                  onChange={(e) =>
                    updateVariant(index, "color", e.target.value)
                  }
                  className="flex-1 rounded-md border px-3 py-2"
                />
                <input
                  type="number"
                  placeholder="Stok"
                  value={variant.stock}
                  onChange={(e) =>
                    updateVariant(index, "stock", e.target.value)
                  }
                  className="w-24 rounded-md border px-3 py-2"
                />
                {variants.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeVariant(index)}
                    className="px-2 text-red-600"
                  >
                    Hapus
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading || images.length === 0}
          className="w-full rounded-md bg-black py-2 text-white disabled:opacity-50"
        >
          {loading ? "Menyimpan..." : "Simpan Produk"}
        </button>
      </form>
    </div>
  );
}