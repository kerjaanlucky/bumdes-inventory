
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Activity, Package, ShoppingCart, Link2Off } from "lucide-react";
import { userMock } from "@/lib/mock/user";
import { useAuthStore } from "@/store/auth-store";

export default function UserDashboardPage() {
  const { name, recentActivities, inventorySummary } = userMock;
  const { userProfile } = useAuthStore();

  if (!userProfile?.branchId) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-24">
        <div className="flex flex-col items-center gap-2 text-center">
          <Link2Off className="h-12 w-12 text-muted-foreground" />
          <h3 className="text-2xl font-bold tracking-tight">
            Akun Anda Belum Tertaut
          </h3>
          <p className="text-sm text-muted-foreground">
            Anda belum ditugaskan ke cabang mana pun. Silakan hubungi administrator Anda.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4">
      <h1 className="text-lg font-semibold md:text-2xl font-headline">Selamat Datang, {userProfile.name}!</h1>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Barang Tersedia</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventorySummary.inStock}</div>
            <p className="text-xs text-muted-foreground">
              di {inventorySummary.categories} kategori
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pembelian Tertunda</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventorySummary.pendingPurchases}</div>
            <p className="text-xs text-muted-foreground">
              Menunggu pengiriman
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktivitas Terkini</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             <div className="text-sm text-muted-foreground">
                {recentActivities.length > 0 ? (
                    <ul>
                        {recentActivities.map((activity, index) => (
                            <li key={index} className="flex items-center gap-2">
                                <span className="font-semibold">{activity.action}:</span>
                                <span>{activity.details}</span>
                                <span className="text-xs text-gray-500">({activity.time})</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>Tidak ada aktivitas terkini.</p>
                )}
             </div>
          </CardContent>
        </Card>
      </div>
       <Card>
        <CardHeader>
            <CardTitle>Aksi Pengguna</CardTitle>
            <CardDescription>Aksi cepat untuk tugas harian Anda.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-24">
              <div className="flex flex-col items-center gap-1 text-center">
                <h3 className="text-2xl font-bold tracking-tight">
                  Fitur spesifik pengguna segera hadir
                </h3>
                <p className="text-sm text-muted-foreground">
                  Anda akan dapat melakukan aksi di sini.
                </p>
              </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
