// lib/validations/auth.ts
//
// Kenapa validasi dipisah ke file sendiri?
// Supaya skema yang sama bisa dipakai ulang di 2 tempat:
// - di API route (validasi server, wajib, karena client tidak bisa dipercaya)
// - di form React (validasi awal biar user dapat feedback cepat)

import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  role: z.enum(["BUYER", "SELLER"]).default("BUYER"),
  // Field tambahan ini hanya wajib diisi kalau role === "SELLER"
  storeName: z.string().optional(),
  storeCity: z.string().optional(),
  storePostalCode: z.string().optional(),
}).refine(
  (data) => data.role !== "SELLER" || (data.storeName && data.storeName.length > 0),
  { message: "Nama toko wajib diisi untuk pendaftaran seller", path: ["storeName"] }
).refine(
  (data) => data.role !== "SELLER" || (data.storeCity && data.storeCity.length > 0),
  { message: "Kota toko wajib diisi (untuk hitung ongkir)", path: ["storeCity"] }
).refine(
  (data) => data.role !== "SELLER" || (data.storePostalCode && /^\d{5}$/.test(data.storePostalCode)),
  { message: "Kode pos toko wajib diisi, 5 digit angka", path: ["storePostalCode"] }
);

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export type LoginInput = z.infer<typeof loginSchema>;