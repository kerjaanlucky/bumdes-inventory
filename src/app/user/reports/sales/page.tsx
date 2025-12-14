
"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DateRange } from "react-day-picker";
import { format, subDays } from 'date-fns';
import { Calendar as CalendarIcon, Eye, Download } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { useReportStore } from '@/store/report-store';
import { Sale } from '@/lib/types';
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import * as XLSX from 'xlsx';


export default function SalesReportPage() {
  const router = useRouter();
  const {
    sales,
    summary,
    dateRange,
    setDateRange,
    fetchSalesReport,
    isFetching,
  } = useReportStore();

  useEffect(() => {
    fetchSalesReport();
  }, [dateRange, fetchSalesReport]);

  const handleDownloadExcel = () => {
    const header = [
      "Nomor Penjualan",
      "Pelanggan",
      "Tanggal",
      "Total",
      "Status",
    ];

    const dataToExport = sales.map(sale => [
      sale.nomor_penjualan,
      sale.nama_customer,
      format(new Date(sale.tanggal_penjualan), "dd MMM yyyy"),
      sale.total_harga,
      sale.status,
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([header, ...dataToExport]);
    
    // Add summary title and data
    const summaryData = [
      [],
      ["Ringkasan Laporan"],
      ["Total Penjualan", summary.totalRevenue],
      ["Jumlah Transaksi", summary.totalTransactions],
      ["Rata-rata Transaksi", summary.averageTransactionValue]
    ];
    XLSX.utils.sheet_add_aoa(worksheet, summaryData, { origin: -1 });

    // Add Period
    const period = `Periode: ${dateRange?.from ? format(dateRange.from, "dd MMM yyyy") : ''} - ${dateRange?.to ? format(dateRange.to, "dd MMM yyyy") : ''}`;
    XLSX.utils.sheet_add_aoa(worksheet, [[period]], { origin: 'A1' });
    
    // Move header down
     XLSX.utils.sheet_add_aoa(worksheet, [header], { origin: 'A3' });
     XLSX.utils.sheet_add_json(worksheet, sales.map(sale => ({
      'Nomor Penjualan': sale.nomor_penjualan,
      'Pelanggan': sale.nama_customer,
      'Tanggal': format(new Date(sale.tanggal_penjualan), "dd MMM yyyy"),
      'Total': sale.total_harga,
      'Status': sale.status,
    })), { origin: 'A4', skipHeader: true });


    // Set column widths
    worksheet['!cols'] = [
      { wch: 20 }, // Nomor Penjualan
      { wch: 25 }, // Pelanggan
      { wch: 15 }, // Tanggal
      { wch: 15 }, // Total
      { wch: 15 }, // Status
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Penjualan");

    XLSX.writeFile(workbook, `Laporan_Penjualan_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl font-headline">Laporan Penjualan</h1>
        <div className="ml-auto flex items-center gap-2">
           <Button onClick={handleDownloadExcel} variant="outline" size="sm" disabled={isFetching || sales.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Download Excel
            </Button>
           <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-[300px] justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pilih rentang tanggal</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

       <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Penjualan</CardTitle>
          </CardHeader>
          <CardContent>
            {isFetching ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">Rp{summary.totalRevenue.toLocaleString('id-ID')}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jumlah Transaksi</CardTitle>
          </CardHeader>
          <CardContent>
            {isFetching ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{summary.totalTransactions}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rata-rata Transaksi</CardTitle>
          </CardHeader>
          <CardContent>
            {isFetching ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">Rp{summary.averageTransactionValue.toLocaleString('id-ID')}</div>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Rincian Transaksi</CardTitle>
            <CardDescription>Daftar semua transaksi penjualan dalam periode yang dipilih.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Penjualan</TableHead>
                <TableHead>Pelanggan</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isFetching ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-10 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : sales.map((sale: Sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-medium font-mono text-xs">{sale.nomor_penjualan}</TableCell>
                  <TableCell>{sale.nama_customer}</TableCell>
                  <TableCell>{format(new Date(sale.tanggal_penjualan), "dd MMM yyyy")}</TableCell>
                  <TableCell>Rp{sale.total_harga.toLocaleString('id-ID')}</TableCell>
                  <TableCell><Badge variant={sale.status === 'LUNAS' ? 'default' : 'secondary'}>{sale.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => router.push(`/user/sales/${sale.id}`)}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">Lihat Detail</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Lihat Detail</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
