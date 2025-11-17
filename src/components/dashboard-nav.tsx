"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingCart,
  CreditCard,
  BarChart3,
  Users,
  Building2,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import * as React from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useSidebar } from "./ui/sidebar";

const links = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Master Barang",
    href: "/items",
    icon: Package,
  },
  {
    label: "Stock",
    href: "/stock",
    icon: Boxes,
  },
  {
    label: "Pembelian",
    href: "/purchases",
    icon: ShoppingCart,
  },
  {
    label: "Penjualan",
    href: "/sales",
    icon: CreditCard,
  },
  {
    label: "Pelaporan",
    href: "/reports",
    icon: BarChart3,
  },
];

const adminLinks = [
  {
    label: "Cabang",
    href: "/admin/branches",
    icon: Building2,
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: Users,
  },
];

export function DashboardNav() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const isAdminOpen = adminLinks.some((link) => pathname.startsWith(link.href));

  return (
    <>
      <SidebarMenu>
        {links.map((link) => (
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
      
      <Collapsible defaultOpen={isAdminOpen}>
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              className="justify-between"
              tooltip="Admin"
              data-state={isAdminOpen ? "open" : "closed"}
            >
              <div className="flex items-center gap-2">
                <Users />
                <span>Admin</span>
              </div>
              {state === "expanded" && <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />}
            </SidebarMenuButton>
          </CollapsibleTrigger>
        </SidebarMenuItem>
        <CollapsibleContent>
          <SidebarMenuSub>
            {adminLinks.map((link) => (
              <SidebarMenuSubItem key={link.href}>
                <SidebarMenuSubButton asChild isActive={pathname === link.href}>
                  <Link href={link.href}>
                    <link.icon />
                    <span>{link.label}</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </>
  );
}
