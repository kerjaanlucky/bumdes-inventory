"use client";

import MasterLayout from "@/components/layouts/master-layout";
import { NavAdmin } from "@/components/layouts/nav-admin";
import { useRoleGuard } from "@/firebase/auth/use-auth-redirect";
import { Loader2 } from "lucide-react";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isLoading = useRoleGuard('admin');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
   <MasterLayout nav={<NavAdmin />}>
      {children}
   </MasterLayout>
  );
}
