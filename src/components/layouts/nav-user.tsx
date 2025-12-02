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
  Truck,
  Warehouse,
  FileText,
  Landmark,
  Settings
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
    label: "Biaya",
    href: "/user/expenses",
    icon: Landmark,
  },
];

const inventoryLinks = [
    {
        label: "Laporan Stok",
        href: "/user/inventory/stock-report",
    },
    {
        label: "Movement",
        href: "/user/stock",
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

const reportLinks = [
    {
        label: "Laporan Penjualan",
        href: "/user/reports/sales",
    },
     {
        label: "Laporan HPP",
        href: "/user/reports/cogs",
    },
    {
        label: "Laba & Rugi",
        href: "/user/reports/profit-loss",
    },
];


export function NavUser() {
  const pathname = usePathname();
  const isMasterDataActive = masterDataLinks.some(link => pathname.startsWith(link.href));
  const isInventoryActive = inventoryLinks.some(link => pathname.startsWith(link.href));
  const isReportActive = reportLinks.some(link => pathname.startsWith(link.href));
  
  const [isMasterDataOpen, setIsMasterDataOpen] = React.useState(isMasterDataActive);
  const [isInventoryOpen, setIsInventoryOpen] = React.useState(isInventoryActive);
  const [isReportOpen, setIsReportOpen] = React.useState(isReportActive);

  React.useEffect(() => {
    if (isMasterDataActive) setIsMasterDataOpen(true);
  }, [isMasterDataActive]);

  React.useEffect(() => {
    if (isInventoryActive) setIsInventoryOpen(true);
  }, [isInventoryActive]);

  React.useEffect(() => {
    if (isReportActive) setIsReportOpen(true);
  }, [isReportActive]);


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
      
       <Collapsible open={isReportOpen} onOpenChange={setIsReportOpen}>
        <SidebarMenuItem>
            <CollapsibleTrigger asChild>
                 <SidebarMenuButton
                    variant="ghost"
                    className="w-full justify-start"
                    isActive={isReportActive}
                    >
                    <BarChart3 />
                    <span>Laporan</span>
                    <ChevronRight className={cn("ml-auto h-4 w-4 transition-transform", isReportOpen && "rotate-90")} />
                </SidebarMenuButton>
            </CollapsibleTrigger>
        </SidebarMenuItem>
        <CollapsibleContent>
            <SidebarMenuSub>
                {reportLinks.map((link) => (
                    <SidebarMenuItem key={link.href}>
                        <SidebarMenuSubButton asChild isActive={pathname.startsWith(link.href)}>
                            <Link href={link.href}>{link.label}</Link>
                        </SidebarMenuSubButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>

       <Collapsible open={isInventoryOpen} onOpenChange={setIsInventoryOpen}>
        <SidebarMenuItem>
            <CollapsibleTrigger asChild>
                 <SidebarMenuButton
                    variant="ghost"
                    className="w-full justify-start"
                    isActive={isInventoryActive}
                    >
                    <Warehouse />
                    <span>Persediaan</span>
                    <ChevronRight className={cn("ml-auto h-4 w-4 transition-transform", isInventoryOpen && "rotate-90")} />
                </SidebarMenuButton>
            </CollapsibleTrigger>
        </SidebarMenuItem>
        <CollapsibleContent>
            <SidebarMenuSub>
                {inventoryLinks.map((link) => (
                    <SidebarMenuItem key={link.href}>
                        <SidebarMenuSubButton asChild isActive={pathname.startsWith(link.href)}>
                            <Link href={link.href}>{link.label}</Link>
                        </SidebarMenuSubButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>

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
      <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            isActive={pathname.startsWith("/user/settings")}
            tooltip="Pengaturan"
          >
            <Link href="/user/settings">
              <Settings />
              <span>Pengaturan</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
    </SidebarMenu>
  );
}
