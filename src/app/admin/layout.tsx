"use client";

import MasterLayout from "@/components/layouts/master-layout";
import { NavAdmin } from "@/components/layouts/nav-admin";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
   <MasterLayout nav={<NavAdmin />}>
      {children}
   </MasterLayout>
  );
}
