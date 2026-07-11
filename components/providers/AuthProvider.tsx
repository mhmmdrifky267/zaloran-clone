// components/providers/AuthProvider.tsx
//
// SessionProvider dari next-auth wajib Client Component, tapi root layout
// kita adalah Server Component. Makanya dibungkus lagi di sini, baru
// dipakai di layout — pola umum untuk "menyuntikkan" Provider ke Server Component.

"use client";

import { SessionProvider } from "next-auth/react";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}