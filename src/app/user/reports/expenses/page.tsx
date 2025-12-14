
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { DateRange } from "react-day-picker";
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Download, PlayCircle, Loader2, ChevronDown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { useReportStore } from '@/store/report-store';
import { Expense } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type GroupedExpenses = {
  [key: string]: {
    items: Expense[];
    total: number;
  };
};

export default function ExpensesReportPage() {
  const {
    expenses,
    expenseSummary,
    dateRange,
    setDateRange,
    fetchExpensesReport,
    isFetching,
  } = useReportStore();

  const handleGenerateReport = () => {
    fetchExpensesReport();
  };
  
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

  const groupedExpenses = useMemo(() => {
    return expenses.reduce((acc, expense) => {
      const categoryName = expense.nama_kategori || 'Tanpa Kategori';
      if (!acc[categoryName]) {
        acc[categoryName] = { items: [], total: 0 };
      }
      acc[categoryName].items.push(expense);
      acc[categoryName].total += expense.jumlah;
      return acc;
    }, {} as GroupedExpenses);
  }, [expenses]);
  
  useEffect(() => {
    // Automatically open all categories when data is fetched
    const initialOpenState = Object.keys(groupedExpenses).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setOpenCategories(initialOpenState);
  }, [groupedExpenses]);


  const toggleCategory = (categoryId: string) => {
    setOpenCategories(prev => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  const handleDownloadExcel = () => {
    const dataToExport = expenses.map(item => ({
      'Tanggal': format(new Date(item.tanggal), "dd MMM yyyy"),
      'Kategori': item.nama_kategori,
      'Deskripsi': item.deskripsi,
      'Jumlah': item.jumlah,
    }));
    
    const worksheet = XLSX.utils.json_to_sheet([]);
    const period = `Periode: ${dateRange?.from ? format(dateRange.from, "dd MMM yyyy") : ''} - ${dateRange?.to ? format(dateRange.to, "dd MMM yyyy") : ''}`;
    XLSX.utils.sheet_add_aoa(worksheet, [["Laporan Biaya"], [period], []], { origin: 'A1' });
    XLSX.utils.sheet_add_json(worksheet, dataToExport, { origin: 'A4' });

    XLSX.utils.sheet_add_aoa(worksheet, [
      [],
      ["Total Pengeluaran", expenseSummary.totalExpenses],
    ], { origin: -1 });

    worksheet['!cols'] = [{ wch: 15 }, { wch: 25 }, { wch: 40 }, { wch: 15 }];
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Biaya");
    
    XLSX.writeFile(workbook, `Laporan_Biaya_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl font-headline">Laporan Biaya</h1>
        <div className="ml-auto flex items-center gap-2">
            <Button onClick={handleDownloadExcel} variant="outline" size="sm" disabled={isFetching || expenses.length === 0}>
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
           <Button onClick={handleGenerateReport} disabled={isFetching}>
                {isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}
                Generate
            </Button>
        </div>
      </div>

       <Card>
        <CardHeader>
            <CardTitle>Ringkasan Biaya</CardTitle>
        </CardHeader>
        <CardContent>
             {isFetching ? <Skeleton className="h-8 w-3/4" /> : 
                <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Pengeluaran</span>
                    <span className="text-2xl font-bold">Rp{expenseSummary.totalExpenses.toLocaleString('id-ID')}</span>
                </div>
            }
        </CardContent>
       </Card>

      <Card>
        <CardHeader>
            <CardTitle>Rincian Biaya per Kategori</CardTitle>
            <CardDescription>Daftar semua pengeluaran dalam periode yang dipilih, dikelompokkan berdasarkan kategori.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Tanggal</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
              </TableRow>
            </TableHeader>
              {isFetching ? (
                <TableBody>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={3}><Skeleton className="h-5 w-full" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              ) : Object.keys(groupedExpenses).length > 0 ? (
                Object.entries(groupedExpenses).map(([categoryName, data]) => (
                  <Collapsible key={categoryName} asChild open={openCategories[categoryName] ?? true} onOpenChange={() => toggleCategory(categoryName)}>
                    <TableBody>
                      <CollapsibleTrigger asChild>
                          <TableRow className="bg-muted/50 hover:bg-muted font-semibold cursor-pointer">
                              <TableCell colSpan={2}>
                                  <div className="flex items-center gap-2">
                                      <ChevronDown className={cn("h-4 w-4 transition-transform", (openCategories[categoryName] ?? true) && "-rotate-90")} />
                                      {categoryName}
                                  </div>
                              </TableCell>
                              <TableCell className="text-right">Rp{data.total.toLocaleString('id-ID')}</TableCell>
                          </TableRow>
                      </CollapsibleTrigger>
                      <CollapsibleContent asChild>
                          <>
                              {data.items.map(item => (
                                  <TableRow key={item.id} className="text-sm">
                                  <TableCell>{format(new Date(item.tanggal), "dd MMM yyyy")}</TableCell>
                                  <TableCell>{item.deskripsi}</TableCell>
                                  <TableCell className="text-right">Rp{item.jumlah.toLocaleString('id-ID')}</TableCell>
                                  </TableRow>
                              ))}
                          </>
                      </CollapsibleContent>
                    </TableBody>
                  </Collapsible>
                ))
              ) : (
                <TableBody>
                    <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                        Tidak ada data biaya untuk periode ini. Silakan generate laporan.
                    </TableCell>
                    </TableRow>
                </TableBody>
              )}
            {!isFetching && Object.keys(groupedExpenses).length > 0 && (
                <TableFooter>
                    <TableRow className="font-bold text-base">
                        <TableCell colSpan={2} className="text-right">Total Keseluruhan</TableCell>
                        <TableCell className="text-right">Rp{expenseSummary.totalExpenses.toLocaleString('id-ID')}</TableCell>
                    </TableRow>
                </TableFooter>
            )}
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
