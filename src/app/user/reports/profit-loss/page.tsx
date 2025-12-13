
"use client";

import React, { useEffect } from 'react';
import { DateRange } from "react-day-picker";
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { useReportStore } from '@/store/report-store';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

export default function ProfitLossReportPage() {
  const {
    profitAndLoss,
    dateRange,
    setDateRange,
    fetchProfitAndLossReport,
    isFetching,
  } = useReportStore();

  useEffect(() => {
    fetchProfitAndLossReport();
  }, [dateRange, fetchProfitAndLossReport]);
  
  const { revenue, cogs, grossProfit, expenses, netProfit } = profitAndLoss;

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl font-headline">Laporan Laba Rugi</h1>
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

      <Card>
        <CardHeader>
            <CardTitle>Laporan Laba Rugi</CardTitle>
            <CardDescription>
                Ringkasan pendapatan dan pengeluaran untuk periode yang dipilih.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            {isFetching ? (
                <div className="space-y-4">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-8 w-2/3" />
                </div>
            ) : (
                <div className="space-y-4 text-sm">
                    {/* Pendapatan */}
                    <div className="flex justify-between items-center">
                        <span className="font-semibold">Pendapatan (Revenue)</span>
                        <span className="font-semibold">Rp{revenue.toLocaleString('id-ID')}</span>
                    </div>
                    <Separator />

                    {/* HPP */}
                    <div className="flex justify-between items-center pl-4">
                        <span>Harga Pokok Penjualan (HPP)</span>
                        <span className="text-red-500">(Rp{cogs.toLocaleString('id-ID')})</span>
                    </div>
                    <Separator />
                    
                    {/* Laba Kotor */}
                    <div className="flex justify-between items-center font-semibold text-base">
                        <span>Laba Kotor</span>
                        <span>Rp{grossProfit.toLocaleString('id-ID')}</span>
                    </div>
                    <Separator />

                    {/* Beban */}
                    <div className="font-semibold mt-4">Beban Operasional</div>
                     <div className="flex justify-between items-center pl-4">
                        <span>Biaya Operasional & Lainnya</span>
                        <span className="text-red-500">(Rp{expenses.toLocaleString('id-ID')})</span>
                    </div>
                    <Separator />
                    
                     {/* Laba Bersih */}
                    <div className="flex justify-between items-center font-bold text-lg pt-4 bg-muted/50 p-4 rounded-md">
                        <span>Laba Bersih</span>
                        <span>Rp{netProfit.toLocaleString('id-ID')}</span>
                    </div>

                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
