
"use client";

import React, { useEffect } from 'react';
import { DateRange } from "react-day-picker";
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
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
import { useReportStore, CogsItem } from '@/store/report-store';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

export default function CogsReportPage() {
  const {
    cogsData,
    cogsSummary,
    dateRange,
    setDateRange,
    fetchCogsReport,
    isFetching,
  } = useReportStore();

  useEffect(() => {
    fetchCogsReport();
  }, [dateRange, fetchCogsReport]);

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl font-headline">Laporan Harga Pokok Penjualan (HPP)</h1>
        <div className="ml-auto flex items-center gap-2">
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
            <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
          </CardHeader>
          <CardContent>
            {isFetching ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">Rp{cogsSummary.totalRevenue.toLocaleString('id-ID')}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total HPP</CardTitle>
          </CardHeader>
          <CardContent>
            {isFetching ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">Rp{cogsSummary.totalCogs.toLocaleString('id-ID')}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Laba Kotor</CardTitle>
          </CardHeader>
          <CardContent>
            {isFetching ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">Rp{cogsSummary.totalMargin.toLocaleString('id-ID')}</div>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Rincian Penjualan per Item</CardTitle>
            <CardDescription>Daftar semua item yang terjual dalam periode yang dipilih.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Produk</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Harga Jual</TableHead>
                <TableHead>Harga Modal</TableHead>
                <TableHead>Margin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isFetching ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : cogsData.length > 0 ? (
                cogsData.map((item: CogsItem, index: number) => (
                    <TableRow key={`${item.saleId}-${index}`}>
                    <TableCell>{format(new Date(item.saleDate), "dd MMM yyyy")}</TableCell>
                    <TableCell>{item.productName}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>Rp{item.sellingPrice.toLocaleString('id-ID')}</TableCell>
                    <TableCell>Rp{item.costPrice.toLocaleString('id-ID')}</TableCell>
                    <TableCell className="font-semibold text-green-600">Rp{item.margin.toLocaleString('id-ID')}</TableCell>
                    </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Tidak ada data penjualan untuk periode ini.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
