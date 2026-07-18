// components/layout/Navbar.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useCartStore } from "@/store/cart.store";
import { ShoppingBag, Heart, ChevronDown, LayoutDashboard, LogOut } from "lucide-react";

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const totalItems = useCartStore((state) => state.totalItems);
  const fetchCart = useCartStore((state) => state.fetchCart);

  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Navbar cuma "menunggu" di halaman BERANDA saat pertama kali dibuka —
  // supaya hero jadi sambutan pertama yang dilihat user. Di halaman lain
  // (/products, /cart, dst), navbar langsung tampil tanpa delay sama sekali.
  const isHomepage = pathname === "/";
  const [visible, setVisible] = useState(!isHomepage);

  useEffect(() => {
    // Kalau bukan homepage, `visible` sudah `true` sejak initial state di
    // atas (lihat useState(!isHomepage)) — effect ini tidak perlu melakukan
    // apa pun untuk kasus itu.
    if (!isHomepage) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Disatukan lewat satu setTimeout (delay 0 kalau reduce-motion aktif)
    // supaya setState SELALU terjadi di dalam callback, bukan langsung di
    // badan effect — pola yang direkomendasikan React untuk menghindari
    // cascading render.
    const delay = prefersReducedMotion ? 0 : 1500;
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // sengaja cuma jalan sekali saat mount, bukan tiap pathname berubah

  useEffect(() => {
    if (session?.user) fetchCart();
  }, [session?.user, fetchCart]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header
      className="sticky top-0 z-40 transition-all duration-700 ease-out"
      style={{
        background: "var(--paper)",
        borderBottom: "1px solid var(--line)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-10px)",
        pointerEvents: visible ? "auto" : "none",
      }}
      aria-hidden={!visible}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-8">
        <Link href="/" className="wordmark text-base sm:text-xl">
          <span className="mark">R</span>
          <span>
            R.O.X.
            <small className="hidden sm:block">MARKETPLACE FASHION</small>
          </span>
        </Link>

        <nav className="flex items-center gap-3 sm:gap-5">
          <Link
            href="/products"
            className="hidden text-[13px] font-medium sm:inline"
            style={{ color: "var(--ink)" }}
          >
            Produk
          </Link>

          {session?.user ? (
            <>
              <Link href="/wishlist" className="icon-btn" aria-label="Wishlist">
                <Heart className="h-4.5 w-4.5" strokeWidth={1.8} />
              </Link>

              <Link href="/cart" className="icon-btn" aria-label="Keranjang">
                <ShoppingBag className="h-4.5 w-4.5" strokeWidth={1.8} />
                {totalItems > 0 && <span className="badge-dot">{totalItems}</span>}
              </Link>

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileOpen((v) => !v)}
                  className="tag tag-ghost"
                  style={{ paddingLeft: "12px" }}
                >
                  <span className="hidden sm:inline">{session.user.name}</span>
                  <ChevronDown className="h-3 w-3" />
                </button>

                {profileOpen && (
                  <div
                    className="absolute right-0 top-11 w-52 overflow-hidden py-1"
                    style={{
                      background: "var(--paper)",
                      border: "1px solid var(--line)",
                      borderRadius: "6px",
                      boxShadow: "var(--shadow-lg)",
                      animation: "menuIn 0.15s var(--ease-out)",
                    }}
                  >
                    <Link
                      href="/profile"
                      className="block px-4 py-2.5 text-[13px] font-medium transition-colors hover:bg-black/5"
                      onClick={() => setProfileOpen(false)}
                    >
                      Profil Saya
                    </Link>
                    <Link
                      href="/orders"
                      className="block px-4 py-2.5 text-[13px] font-medium transition-colors hover:bg-black/5"
                      onClick={() => setProfileOpen(false)}
                    >
                      Pesanan Saya
                    </Link>

                    {session.user.role === "SELLER" && (
                      <>
                        <hr className="divider-dash" style={{ margin: "4px 0" }} />
                        <Link
                          href="/dashboard"
                          className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium transition-colors hover:bg-black/5"
                          onClick={() => setProfileOpen(false)}
                        >
                          <LayoutDashboard className="h-3.5 w-3.5" />
                          Dashboard Toko
                        </Link>
                        <Link
                          href="/dashboard/profile"
                          className="block px-4 py-2.5 text-[13px] font-medium transition-colors hover:bg-black/5"
                          onClick={() => setProfileOpen(false)}
                        >
                          Profil Toko
                        </Link>
                      </>
                    )}

                    <hr className="divider-dash" style={{ margin: "4px 0" }} />
                    <button
                      onClick={() => signOut()}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[13px] font-medium transition-colors hover:bg-black/5"
                      style={{ color: "var(--stamp-red)" }}
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Keluar
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="text-[13px] font-medium">
                Masuk
              </Link>
              <Link href="/register" className="tag">
                Daftar
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}