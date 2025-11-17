"use client"

import * as React from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { menuData } from "@/components/layouts/menu"
import { NavMain } from "./nav-main";
import { NavProjects } from "./nav-projects";
import { NavUser as NavUserMenu } from "./nav-user-menu";
import { TeamSwitcher } from "./team-switcher";


export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={menuData.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={menuData.navMain} />
        <NavProjects projects={menuData.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUserMenu user={menuData.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
