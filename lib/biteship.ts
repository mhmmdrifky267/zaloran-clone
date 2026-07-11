// lib/biteship.ts
//
// Dokumentasi resmi: https://biteship.com/en/docs/api/rates/retrieve
// Kita pakai pendekatan "by postal code" — paling sederhana, cukup akurat
// untuk kebanyakan kurir reguler (JNE, SiCepat, J&T, dll — tidak termasuk
// kurir instan seperti Gojek/Grab yang butuh koordinat GPS).

const BITESHIP_BASE_URL = "https://api.biteship.com/v1";

export type ShippingItem = {
  name: string;
  value: number; // harga barang, dalam rupiah
  weight: number; // dalam GRAM
  quantity: number;
};

export type CourierRate = {
  courier_name: string;
  courier_service_name: string;
  duration: string; // contoh: "2-3 days"
  price: number;
};

export async function getShippingRates({
  originPostalCode,
  destinationPostalCode,
  items,
  couriers = "jne,jnt,sicepat,anteraja",
}: {
  originPostalCode: string;
  destinationPostalCode: string;
  items: ShippingItem[];
  couriers?: string;
}): Promise<CourierRate[]> {
  const res = await fetch(`${BITESHIP_BASE_URL}/rates/couriers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: process.env.BITESHIP_API_KEY as string,
    },
    body: JSON.stringify({
      origin_postal_code: Number(originPostalCode),
      destination_postal_code: Number(destinationPostalCode),
      couriers,
      items: items.map((item) => ({
        name: item.name,
        value: item.value,
        quantity: item.quantity,
        weight: item.weight,
        // length/width/height Biteship butuh angka — kita pakai nilai
        // default konservatif karena skema kita belum menyimpan dimensi
        // paket per produk (bisa ditambah nanti kalau perlu lebih presisi).
        length: 15,
        width: 15,
        height: 15,
      })),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Biteship error (${res.status}): ${text}`);
  }

  const data = await res.json();

  if (!data.success) {
    throw new Error(data.error ?? "Gagal mengambil tarif ongkir");
  }

  return data.pricing as CourierRate[];
}