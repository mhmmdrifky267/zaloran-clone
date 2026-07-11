// app/(shop)/layout.tsx

import { Navbar } from "@/components/layout/Navbar";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Navbar />
      <main>{children}</main>
    </div>
  );
}