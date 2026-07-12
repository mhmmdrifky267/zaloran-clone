// components/layout/Navbar.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useCartStore } from "@/store/cart.store";
import { ShoppingCart, Heart, User, ChevronDown, LayoutDashboard, LogOut } from "lucide-react";

export function Navbar() {
  const { data: session } = useSession();
  const totalItems = useCartStore((state) => state.totalItems);
  const fetchCart = useCartStore((state) => state.fetchCart);

  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (session?.user) fetchCart();
  }, [session?.user, fetchCart]);

  // Tutup dropdown kalau user klik di luar area dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold">
          R.O.X.
        </Link>

        <nav className="flex items-center gap-5 text-sm">
          <Link href="/products">Produk</Link>

          {session?.user ? (
            <>
              <Link href="/wishlist" aria-label="Wishlist">
                <Heart className="h-5 w-5" />
              </Link>

              {/* Ikon cart + badge jumlah item */}
              <Link href="/cart" className="relative" aria-label="Keranjang">
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[10px] text-white">
                    {totalItems}
                  </span>
                )}
              </Link>

              {/* ---- Section Profil (dropdown) ---- */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileOpen((v) => !v)}
                  className="flex items-center gap-1"
                >
                  <User className="h-5 w-5" />
                  <span>{session.user.name}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-8 w-48 rounded-md border bg-white py-1 shadow-md">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm hover:bg-gray-50"
                      onClick={() => setProfileOpen(false)}
                    >
                      Profil Saya
                    </Link>

                    <Link
                      href="/orders"
                      className="block px-4 py-2 text-sm hover:bg-gray-50"
                      onClick={() => setProfileOpen(false)}
                    >
                      Pesanan Saya
                    </Link>

                    {session.user.role === "SELLER" && (
                      <>
                        <Link
                          href="/dashboard"
                          className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                          onClick={() => setProfileOpen(false)}
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          Dashboard Toko
                        </Link>
                        <Link
                          href="/dashboard/profile"
                          className="block px-4 py-2 text-sm hover:bg-gray-50"
                          onClick={() => setProfileOpen(false)}
                        >
                          Profil Toko
                        </Link>
                      </>
                    )}

                    <button
                      onClick={() => signOut()}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Keluar
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/login">Masuk</Link>
              <Link href="/register">Daftar</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}