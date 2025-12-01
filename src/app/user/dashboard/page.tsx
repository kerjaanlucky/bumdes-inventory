
"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Activity, Package, ShoppingCart, Link2Off, Database, Loader2 } from "lucide-react";
import { userMock } from "@/lib/mock/user";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { useFirebaseStore } from "@/store/firebase-store";
import { toast } from "@/hooks/use-toast";
import { seedProducts } from "@/lib/seeder";


export default function UserDashboardPage() {
  const { name, recentActivities, inventorySummary } = userMock;
  const { userProfile } = useAuthStore();
  const { firestore } = useFirebaseStore();
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeedData = async () => {
    if (!firestore || !userProfile?.branchId) {
      toast({
        variant: "destructive",
        title: "Gagal Seed Data",
        description: "Tidak dapat terhubung ke database atau branch ID tidak ditemukan.",
      });
      return;
    }
    setIsSeeding(true);
    try {
      await seedProducts(firestore, userProfile.branchId);
      toast({
        title: "Seeding Berhasil",
        description: "50 produk contoh telah berhasil ditambahkan ke database.",
      });
    } catch (error) {
      console.error("Seeding failed:", error);
      toast({
        variant: "destructive",
        title: "Seeding Gagal",
        description: "Terjadi kesalahan saat menambahkan data contoh.",
      });
    } finally {
      setIsSeeding(false);
    }
  };


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
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <Card>
            <CardHeader>
              <CardTitle>Aksi Development</CardTitle>
              <CardDescription>Gunakan tombol di bawah ini untuk mengisi data contoh.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleSeedData} disabled={isSeeding}>
                {isSeeding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-4 w-4" />
                    Seed 50 Produk
                  </>
                )}
              </Button>
            </CardContent>
        </Card>
       </div>
    </div>
  );
}
