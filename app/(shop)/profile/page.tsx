// app/(shop)/profile/page.tsx

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAddresses } from "@/services/address.service";
import { AddressManager } from "@/components/address/AddressManager";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const addresses = await getAddresses(session.user.id);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Profil Saya</h1>

      {/* ---- Info akun (read-only dulu; edit nama/foto bisa ditambah nanti) ---- */}
      <div className="mb-8 rounded-md border p-4">
        <p className="text-sm text-gray-500">Nama</p>
        <p className="font-medium">{session.user.name}</p>

        <p className="mt-3 text-sm text-gray-500">Email</p>
        <p className="font-medium">{session.user.email}</p>

        <p className="mt-3 text-sm text-gray-500">Tipe Akun</p>
        <p className="font-medium">
          {session.user.role === "SELLER" ? "Penjual" : "Pembeli"}
        </p>
      </div>

      {/* ---- Manajemen alamat ---- */}
      <AddressManager initialAddresses={addresses} />
    </div>
  );
}