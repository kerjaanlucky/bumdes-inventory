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
  Package,
  ShoppingCart,
  History,
  CreditCard,
  BarChart3,
  Boxes
} from "lucide-react";

const userLinks = [
  {
    label: "Dashboard",
    href: "/user/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Items",
    href: "/user/items",
    icon: Package,
  },
  {
    label: "Stock",
    href: "/user/stock",
    icon: Boxes,
  },
  {
    label: "Purchases",
    href: "/user/purchases",
    icon: ShoppingCart,
  },
  {
    label: "Sales",
    href: "/user/sales",
    icon: CreditCard,
  },
  {
    label: "Reports",
    href: "/user/reports",
    icon: BarChart3,
  },
  {
    label: "Activity Log",
    href: "/user/activity",
    icon: History,
  },
];


export function NavUser() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {userLinks.map((link) => (
        <SidebarMenuItem key={link.href}>
          <SidebarMenuButton
            asChild
            isActive={pathname.startsWith(link.href)}
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
