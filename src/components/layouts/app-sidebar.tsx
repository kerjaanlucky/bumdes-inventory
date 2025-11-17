"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { menuData } from "@/components/layouts/menu"
import { NavAdmin } from "./nav-admin";
import { NavUser } from "./nav-user";
import { NavUser as NavUserMenu } from "./nav-user-menu";
import { Icons } from "../icons";
import Link from "next/link";


export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
         <Link href="#" className="flex items-center gap-2 font-semibold text-primary">
            <Icons.logo className="h-6 w-6" />
            <span className="group-data-[collapsible=icon]:hidden">InventoryFlow</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {isAdmin ? <NavAdmin /> : <NavUser />}
      </SidebarContent>
      <SidebarFooter>
        <NavUserMenu user={menuData.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
