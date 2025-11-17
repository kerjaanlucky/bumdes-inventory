"use client";

import MasterLayout from "@/components/layouts/master-layout";
import { NavUser } from "@/components/layouts/nav-user";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
   <MasterLayout nav={<NavUser />}>
      {children}
   </MasterLayout>
  );
}
