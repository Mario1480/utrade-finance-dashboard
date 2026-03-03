"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  ["/admin/dashboard", "Dashboard"],
  ["/admin/einnahmen", "Einnahmen"],
  ["/admin/ausgaben", "Ausgaben"],
  ["/admin/nft", "NFT"],
  ["/admin/team", "Team"],
  ["/admin/burning", "Burning"],
  ["/admin/community", "Community"],
  ["/admin/adressen", "Adressen"],
  ["/admin/rules", "Regeln"],
  ["/admin/users", "User"],
] as const;

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <div className="top-nav">
      {navItems.map(([href, label]) => (
        <Link key={href} className={`nav-link ${pathname === href ? "active" : ""}`} href={href}>
          {label}
        </Link>
      ))}
      <button className="secondary" onClick={logout} type="button">
        Logout
      </button>
    </div>
  );
}
