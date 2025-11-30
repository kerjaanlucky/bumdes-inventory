"use client";

import MasterLayout from "@/components/layouts/master-layout";
import { NavUser } from "@/components/layouts/nav-user";
import { useRoleGuard } from "@/firebase/auth/use-auth-redirect";
import { Loader2 } from "lucide-react";

export default function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isLoading = useRoleGuard('user');
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
   <MasterLayout nav={<NavUser />}>
      {children}
   </MasterLayout>
  );
}
