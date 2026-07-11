// components/address/AddressManager.tsx
"use client";

import { useState } from "react";
import { AddressForm } from "./AddressForm";

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

export function AddressManager({
  initialAddresses,
}: {
  initialAddresses: Address[];
}) {
  const [addresses, setAddresses] = useState(initialAddresses);
  // "add" = form tambah baru, string = sedang edit address dengan id itu, null = form tertutup
  const [formMode, setFormMode] = useState<"add" | string | null>(null);

  async function refetch() {
    const res = await fetch("/api/addresses");
    if (res.ok) setAddresses(await res.json());
  }

  async function handleDelete(id: string) {
    if (!confirm("Yakin hapus alamat ini?")) return;
    const res = await fetch(`/api/addresses/${id}`, { method: "DELETE" });
    if (res.ok) refetch();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Alamat Saya</h2>
        {formMode === null && (
          <button
            onClick={() => setFormMode("add")}
            className="text-sm text-blue-600"
          >
            + Tambah Alamat
          </button>
        )}
      </div>

      {formMode === "add" && (
        <div className="mb-4 rounded-md border p-4">
          <AddressForm
            onSuccess={() => {
              setFormMode(null);
              refetch();
            }}
            onCancel={() => setFormMode(null)}
          />
        </div>
      )}

      <div className="space-y-3">
        {addresses.map((address) =>
          formMode === address.id ? (
            <div key={address.id} className="rounded-md border p-4">
              <AddressForm
                initialData={address}
                onSuccess={() => {
                  setFormMode(null);
                  refetch();
                }}
                onCancel={() => setFormMode(null)}
              />
            </div>
          ) : (
            <div key={address.id} className="rounded-md border p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{address.label}</p>
                    {address.isDefault && (
                      <span className="rounded-full bg-black px-2 py-0.5 text-xs text-white">
                        Utama
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm">
                    {address.recipient} · {address.phone}
                  </p>
                  <p className="text-sm text-gray-600">
                    {address.fullAddress}, {address.city} {address.postalCode}
                  </p>
                </div>

                <div className="flex gap-3 text-sm">
                  <button
                    onClick={() => setFormMode(address.id)}
                    className="text-blue-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(address.id)}
                    className="text-red-600"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          )
        )}

        {addresses.length === 0 && formMode !== "add" && (
          <p className="text-sm text-gray-500">
            Belum ada alamat tersimpan.
          </p>
        )}
      </div>
    </div>
  );
}