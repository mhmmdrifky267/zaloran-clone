// app/(seller)/dashboard/products/[id]/edit/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { UploadButton } from "@/lib/uploadthing";

type Variant = { size: string; color: string; stock: number };
type Category = { id: string; name: string };

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadCategories() {
      const res = await fetch("/api/categories");
      if (res.ok) setCategories(await res.json());
    }
    loadCategories();
  }, []);

  // Muat data produk yang sudah ada, isi form dengannya
  useEffect(() => {
    async function loadProduct() {
      const res = await fetch(`/api/seller/products/${params.id}`);
      if (!res.ok) {
        setError("Produk tidak ditemukan atau bukan milik kamu");
        setLoading(false);
        return;
      }

      const product = await res.json();
      setName(product.name);
      setDescription(product.description);
      setPrice(String(product.price));
      setCategoryId(product.categoryId);
      setImages(product.images.map((img: { url: string }) => img.url));
      setVariants(
        product.variants.map(
          (v: { size: string | null; color: string | null; stock: number }) => ({
            size: v.size ?? "",
            color: v.color ?? "",
            stock: v.stock,
          })
        )
      );
      setLoading(false);
    }
    loadProduct();
  }, [params.id]);

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

  function removeImage(url: string) {
    setImages(images.filter((img) => img !== url));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const res = await fetch(`/api/seller/products/${params.id}`, {
      method: "PATCH",
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

    setSaving(false);

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

  if (loading) return <div className="py-10 text-center">Memuat produk...</div>;

  if (error && !name) {
    return <div className="py-10 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="mx-auto max-w-2xl py-10">
      <h1 className="mb-6 text-2xl font-bold">Edit Produk</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="mb-1 block text-sm font-medium">Nama Produk</label>
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
            <label className="mb-1 block text-sm font-medium">Harga (Rp)</label>
            <input
              type="number"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-md border px-3 py-2"
            />
          </div>
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

        {/* ---- Gambar ---- */}
        <div>
          <label className="mb-1 block text-sm font-medium">
            Gambar Produk ({images.length}/5)
          </label>

          <div className="mb-3 flex gap-2">
            {images.map((url) => (
              <div key={url} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt="Preview produk"
                  className="h-20 w-20 rounded-md object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs text-white"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {images.length < 5 && (
            <UploadButton
              endpoint="productImage"
              onClientUploadComplete={(res) => {
                const urls = res.map((file) => file.url);
                setImages((prev) => [...prev, ...urls]);
              }}
              onUploadError={(err) => setError(`Upload gagal: ${err.message}`)}
            />
          )}
        </div>

        {/* ---- Varian ---- */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium">Varian</label>
            <button type="button" onClick={addVariant} className="text-sm text-blue-600">
              + Tambah Varian
            </button>
          </div>

          <div className="space-y-2">
            {variants.map((variant, index) => (
              <div key={index} className="flex gap-2">
                <input
                  placeholder="Ukuran (mis. M)"
                  value={variant.size}
                  onChange={(e) => updateVariant(index, "size", e.target.value)}
                  className="flex-1 rounded-md border px-3 py-2"
                />
                <input
                  placeholder="Warna (mis. Hitam)"
                  value={variant.color}
                  onChange={(e) => updateVariant(index, "color", e.target.value)}
                  className="flex-1 rounded-md border px-3 py-2"
                />
                <input
                  type="number"
                  placeholder="Stok"
                  value={variant.stock}
                  onChange={(e) => updateVariant(index, "stock", e.target.value)}
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
          disabled={saving || images.length === 0}
          className="w-full rounded-md bg-black py-2 text-white disabled:opacity-50"
        >
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </form>
    </div>
  );
}