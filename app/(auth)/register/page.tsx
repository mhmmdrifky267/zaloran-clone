// app/(auth)/register/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<"BUYER" | "SELLER">("BUYER");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    storeName: "",
    storeCity: "",
    storePostalCode: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, role }),
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

    // Setelah register sukses, arahkan ke halaman login
    router.push("/login");
  }

  return (
    <div className="mx-auto max-w-sm py-16">
      <h1 className="mb-6 text-2xl font-bold">Daftar</h1>

      {/* Pilihan daftar sebagai Buyer atau Seller */}
      <div className="mb-6 flex rounded-md border">
        <button
          type="button"
          onClick={() => setRole("BUYER")}
          className={`flex-1 py-2 text-sm ${
            role === "BUYER" ? "bg-black text-white" : "bg-white"
          }`}
        >
          Sebagai Pembeli
        </button>
        <button
          type="button"
          onClick={() => setRole("SELLER")}
          className={`flex-1 py-2 text-sm ${
            role === "SELLER" ? "bg-black text-white" : "bg-white"
          }`}
        >
          Sebagai Penjual
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Nama</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-md border px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-md border px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Password</label>
          <input
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full rounded-md border px-3 py-2"
          />
        </div>

        {/* Field ini hanya muncul kalau daftar sebagai Seller */}
        {role === "SELLER" && (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Nama Toko
              </label>
              <input
                required
                value={form.storeName}
                onChange={(e) =>
                  setForm({ ...form, storeName: e.target.value })
                }
                className="w-full rounded-md border px-3 py-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Kota Toko
                </label>
                <input
                  required
                  value={form.storeCity}
                  onChange={(e) =>
                    setForm({ ...form, storeCity: e.target.value })
                  }
                  className="w-full rounded-md border px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Kode Pos
                </label>
                <input
                  required
                  placeholder="cth. 40123"
                  value={form.storePostalCode}
                  onChange={(e) =>
                    setForm({ ...form, storePostalCode: e.target.value })
                  }
                  className="w-full rounded-md border px-3 py-2"
                />
              </div>
            </div>
            <p className="-mt-2 text-xs text-gray-500">
              Kota & kode pos dipakai untuk menghitung ongkos kirim ke pembeli.
            </p>
          </>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-black py-2 text-white disabled:opacity-50"
        >
          {loading ? "Memproses..." : "Daftar"}
        </button>
      </form>
    </div>
  );
}