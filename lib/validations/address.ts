// lib/validations/address.ts

import { z } from "zod";

export const addressSchema = z.object({
  label: z.string().min(1, "Label wajib diisi (mis. Rumah, Kantor)"),
  recipient: z.string().min(2, "Nama penerima wajib diisi"),
  phone: z.string().min(9, "Nomor telepon tidak valid"),
  fullAddress: z.string().min(10, "Alamat lengkap minimal 10 karakter"),
  city: z.string().min(2, "Kota wajib diisi"),
  postalCode: z.string().min(4, "Kode pos tidak valid"),
  isDefault: z.boolean().default(false),
});

export type AddressInput = z.infer<typeof addressSchema>;