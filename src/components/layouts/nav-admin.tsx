"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Users,
  Building2,
} from "lucide-react";

const adminLinks = [
  {
    label: "Dasbor",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Cabang",
    href: "/admin/branches",
    icon: Building2,
  },
  {
    label: "Pengguna",
    href: "/admin/users",
    icon: Users,
  },
];

export function NavAdmin() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {adminLinks.map((link) => (
        <SidebarMenuItem key={link.href}>
          <SidebarMenuButton
            asChild
            isActive={pathname === link.href}
            tooltip={link.label}
          >
            <Link href={link.href}>
              <link.icon />
              <span>{link.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
