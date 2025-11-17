import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarInset, SidebarTrigger, SidebarFooter } from "@/components/ui/sidebar";
import { UserNav } from "@/components/user-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Search } from "lucide-react";
import { Input } from "../ui/input";
import Link from "next/link";
import { Icons } from "../icons";

export default function MasterLayout({
  children,
  nav,
}: {
  children: React.ReactNode;
  nav: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <SidebarTrigger className="-ml-1" />
            <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
                <Icons.logo className="h-6 w-6" />
                <span className="group-data-[collapsible=icon]:hidden">
                    InventoryFlow
                </span>
            </Link>
          </div>
        </SidebarHeader>
        <SidebarContent>
            {nav}
        </SidebarContent>
        <SidebarFooter className="flex-col !gap-0 divide-y divide-sidebar-border border-t border-sidebar-border">
          <div className="flex items-center justify-center p-2">
            <UserNav />
            <div className="flex-1 group-data-[collapsible=icon]:hidden" />
            <div className="group-data-[collapsible=icon]:hidden">
                <ThemeToggle />
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:py-4">
            <SidebarTrigger className="sm:hidden" />
            <div className="relative ml-auto flex-1 md:grow-0">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search..."
                    className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
                />
            </div>
            <div className="hidden sm:block">
                <ThemeToggle />
            </div>
            <UserNav />
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
