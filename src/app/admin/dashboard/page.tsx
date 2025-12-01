
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  Activity,
  CreditCard,
  DollarSign,
  PackageX,
  Database,
  Loader2,
} from "lucide-react";
import { transactions, chartData } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { seedProducts } from "@/lib/seeder";
import { useFirebaseStore } from "@/store/firebase-store";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

export default function DashboardPage() {
  const { firestore } = useFirebaseStore();
  const { userProfile } = useAuthStore();
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


  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp45.231.890</div>
            <p className="text-xs text-muted-foreground">
              +20.1% dari bulan lalu
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Penjualan</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+2350</div>
            <p className="text-xs text-muted-foreground">
              +180.1% dari bulan lalu
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Barang Stok Rendah</CardTitle>
            <PackageX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              3 barang habis
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Sekarang</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+573</div>
            <p className="text-xs text-muted-foreground">
              +201 sejak jam terakhir
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Transaksi Terkini</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Barang</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <Badge variant={transaction.type === "Sale" ? "default" : "secondary"}>
                        {transaction.type === "Sale" ? "Penjualan" : "Pembelian"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{transaction.date}</TableCell>
                    <TableCell>{transaction.items}</TableCell>
                    <TableCell className="text-right">Rp{transaction.amount.toLocaleString('id-ID')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Ikhtisar Penjualan</CardTitle>
              <CardDescription>Ikhtisar penjualan Anda tahun ini.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                  config={{
                      total: {
                          label: 'Total',
                          color: 'hsl(var(--primary))',
                      },
                  }}
                  className="min-h-[200px] w-full"
              >
                  <BarChart accessibilityLayer data={chartData}>
                      <XAxis
                          dataKey="month"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          tickFormatter={(value) => value.slice(0, 3)}
                      />
                      <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `Rp${value/1000}k`} />
                      <Tooltip cursor={{fill: 'hsl(var(--muted))'}} content={<ChartTooltipContent />} />
                      <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
              </ChartContainer>
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
    </div>
  );
}
