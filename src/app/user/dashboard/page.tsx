
"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Package,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { useReportStore, DashboardData } from "@/store/report-store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ChartTimeRange = '7d' | '30d';

export default function UserDashboardPage() {
  const { 
    dashboardData, 
    fetchDashboardData, 
    isFetching 
  } = useReportStore();
  
  const [timeRange, setTimeRange] = useState<ChartTimeRange>('7d');

  useEffect(() => {
    fetchDashboardData(timeRange);
  }, [fetchDashboardData, timeRange]);

  const { summary, topProducts, chartData } = dashboardData || {};

  return (
    <div className="flex flex-col gap-4 py-4">
       <div className="flex justify-end">
        <Select value={timeRange} onValueChange={(value: ChartTimeRange) => setTimeRange(value)}>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Pilih rentang waktu" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="7d">7 Hari Terakhir</SelectItem>
                <SelectItem value="30d">30 Hari Terakhir</SelectItem>
            </SelectContent>
        </Select>
      </div>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Penjualan Hari Ini</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isFetching ? <Loader2 className="h-6 w-6 animate-spin"/> : (
              <>
                <div className="text-2xl font-bold">Rp{summary?.todayRevenue.toLocaleString('id-ID') || 0}</div>
                <p className="text-xs text-muted-foreground">
                  vs kemarin: Rp{summary?.yesterdayRevenue.toLocaleString('id-ID') || 0}
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Laba Hari Ini</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isFetching ? <Loader2 className="h-6 w-6 animate-spin"/> : (
              <>
                <div className="text-2xl font-bold">Rp{summary?.todayProfit.toLocaleString('id-ID') || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Estimasi laba kotor
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transaksi Hari Ini</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isFetching ? <Loader2 className="h-6 w-6 animate-spin"/> : (
                <div className="text-2xl font-bold">+{summary?.todayTransactions || 0}</div>
             )}
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stok Rendah</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isFetching ? <Loader2 className="h-6 w-6 animate-spin"/> : (
                <div className="text-2xl font-bold">{summary?.lowStockItems || 0}</div>
             )}
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Ikhtisar Penjualan & Laba</CardTitle>
            <CardDescription>
              Pendapatan dan laba kotor selama {timeRange === '7d' ? '7' : '30'} hari terakhir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isFetching ? <div className="h-[350px] w-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
              <ChartContainer
                  config={{
                      penjualan: {
                          label: 'Penjualan',
                          color: 'hsl(var(--primary))',
                      },
                       laba: {
                          label: 'Laba',
                          color: 'hsl(var(--chart-2))',
                      },
                  }}
                  className="min-h-[350px] w-full"
              >
                  <BarChart accessibilityLayer data={chartData}>
                      <XAxis
                          dataKey="date"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                      />
                      <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `Rp${Number(value) / 1000}k`} />
                      <Tooltip cursor={{fill: 'hsl(var(--muted))'}} content={<ChartTooltipContent />} />
                      <Bar dataKey="penjualan" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="laba" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Produk Terlaris Hari Ini</CardTitle>
                <CardDescription>5 produk dengan kuantitas penjualan tertinggi hari ini.</CardDescription>
            </CardHeader>
            <CardContent>
               {isFetching ? <Loader2 className="h-6 w-6 animate-spin"/> : (
                 topProducts && topProducts.length > 0 ? (
                    <div className="space-y-4">
                        {topProducts.map((product, index) => (
                            <div key={index} className="flex items-center">
                                <div>
                                    <p className="text-sm font-medium leading-none">{product.nama_produk}</p>
                                    <p className="text-sm text-muted-foreground">{product.kode_produk}</p>
                                </div>
                                <div className="ml-auto font-medium">{product.total_quantity} terjual</div>
                            </div>
                        ))}
                    </div>
                 ) : (
                    <div className="text-sm text-muted-foreground">Belum ada penjualan hari ini.</div>
                 )
               )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
