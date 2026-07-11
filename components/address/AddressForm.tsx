// components/address/AddressForm.tsx
"use client";

import { useState } from "react";

type Address = {
  id: string;
  label: string;
  recipient: string;
  phone: string;
  fullAddress: string;
  city: string;
  postalCode: string;
  isDefault: boolean;
};

type AddressFormProps = {
  initialData?: Address; // kalau ada = mode edit, kalau tidak = mode tambah
  onSuccess: () => void;
  onCancel: () => void;
};

export function AddressForm({
  initialData,
  onSuccess,
  onCancel,
}: AddressFormProps) {
  const [form, setForm] = useState({
    label: initialData?.label ?? "",
    recipient: initialData?.recipient ?? "",
    phone: initialData?.phone ?? "",
    fullAddress: initialData?.fullAddress ?? "",
    city: initialData?.city ?? "",
    postalCode: initialData?.postalCode ?? "",
    isDefault: initialData?.isDefault ?? false,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const url = initialData
      ? `/api/addresses/${initialData.id}`
      : "/api/addresses";
    const method = initialData ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
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

    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium">Label</label>
          <input
            required
            placeholder="Rumah / Kantor"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">
            Nama Penerima
          </label>
          <input
            required
            value={form.recipient}
            onChange={(e) => setForm({ ...form, recipient: e.target.value })}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium">No. Telepon</label>
        <input
          required
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium">
          Alamat Lengkap
        </label>
        <textarea
          required
          rows={3}
          value={form.fullAddress}
          onChange={(e) => setForm({ ...form, fullAddress: e.target.value })}
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium">Kota</label>
          <input
            required
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">Kode Pos</label>
          <input
            required
            value={form.postalCode}
            onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.isDefault}
          onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
        />
        Jadikan alamat utama
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {loading ? "Menyimpan..." : "Simpan"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border px-4 py-2 text-sm"
        >
          Batal
        </button>
      </div>
    </form>
  );
}