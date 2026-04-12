"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav
      className="w-full px-6 py-4 flex items-center justify-between border-b"
      style={{ background: "#FBF7F0", borderColor: "#EAE2D6" }}
    >
      {/* Logo */}
      <Link href="/home" className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: "#3D2C1E" }}
        >
          <ShieldCheck className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-lg" style={{ color: "#3D2C1E" }}>
          Guardia
        </span>
      </Link>

      {/* Links */}
      <div className="flex items-center gap-6">
        <Link
          href="/home"
          className="text-sm font-medium transition-colors"
          style={{ color: pathname === "/home" ? "#C17B3A" : "#3D2C1E" }}
        >
          Home
        </Link>
        <Link
          href="/profile"
          className="text-sm font-medium transition-colors"
          style={{ color: pathname === "/profile" ? "#C17B3A" : "#3D2C1E" }}
        >
          My Profile
        </Link>
        <Link
          href="/chat"
          className="text-sm font-semibold px-4 py-2 rounded-xl text-white transition"
          style={{ background: "#C17B3A" }}
        >
          Check Now
        </Link>
      </div>
    </nav>
  );
}
