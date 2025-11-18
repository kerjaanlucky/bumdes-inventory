"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  History,
  CreditCard,
  BarChart3,
  Boxes,
  Database,
  Users,
  Truck
} from "lucide-react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";


const userLinks = [
  {
    label: "Dasbor",
    href: "/user/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Stok",
    href: "/user/stock",
    icon: Boxes,
  },
  {
    label: "Pembelian",
    href: "/user/purchases",
    icon: ShoppingCart,
  },
  {
    label: "Penjualan",
    href: "/user/sales",
    icon: CreditCard,
  },
  {
    label: "Laporan",
    href: "/user/reports",
    icon: BarChart3,
  },
  {
    label: "Log Aktivitas",
    href: "/user/activity",
    icon: History,
  },
];

const masterDataLinks = [
    {
        label: "Produk",
        href: "/user/products",
    },
    {
        label: "Kategori",
        href: "/user/categories",
    },
    {
        label: "Satuan",
        href: "/user/units",
    },
    {
        label: "Pelanggan",
        href: "/user/customers",
    },
    {
        label: "Pemasok",
        href: "/user/suppliers",
    }
];


export function NavUser() {
  const pathname = usePathname();
  const isMasterDataActive = masterDataLinks.some(link => pathname.startsWith(link.href));
  const [isMasterDataOpen, setIsMasterDataOpen] = React.useState(isMasterDataActive);

  React.useEffect(() => {
    if (isMasterDataActive) {
      setIsMasterDataOpen(true);
    }
  }, [isMasterDataActive]);


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
       <Collapsible open={isMasterDataOpen} onOpenChange={setIsMasterDataOpen}>
        <SidebarMenuItem>
            <CollapsibleTrigger asChild>
                 <SidebarMenuButton
                    variant="ghost"
                    className="w-full justify-start"
                    isActive={isMasterDataActive}
                    >
                    <Database />
                    <span>Master Data</span>
                    <ChevronRight className={cn("ml-auto h-4 w-4 transition-transform", isMasterDataOpen && "rotate-90")} />
                </SidebarMenuButton>
            </CollapsibleTrigger>
        </SidebarMenuItem>
        <CollapsibleContent>
            <SidebarMenuSub>
                {masterDataLinks.map((link) => (
                    <SidebarMenuItem key={link.href}>
                        <SidebarMenuSubButton asChild isActive={pathname.startsWith(link.href)}>
                            <Link href={link.href}>{link.label}</Link>
                        </SidebarMenuSubButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenu>
  );
}
