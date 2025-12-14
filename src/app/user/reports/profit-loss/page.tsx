
"use client";

import React, { useEffect, useRef, useState } from 'react';
import { DateRange } from "react-day-picker";
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Download, FileDown, Loader2, ChevronsUpDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { useReportStore } from '@/store/report-store';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from '@/hooks/use-toast';

export default function ProfitLossReportPage() {
  const {
    profitAndLoss,
    dateRange,
    setDateRange,
    fetchProfitAndLossReport,
    isFetching,
  } = useReportStore();
  
  const reportRef = useRef<HTMLDivElement>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  useEffect(() => {
    fetchProfitAndLossReport();
  }, [dateRange, fetchProfitAndLossReport]);
  
  const { revenue, cogs, grossProfit, expenses, netProfit } = profitAndLoss;

  const handleDownloadExcel = () => {
    const data = [
      { Category: 'Pendapatan (Revenue)', Amount: revenue },
      { Category: 'Harga Pokok Penjualan (HPP)', Amount: -cogs },
      { Category: 'Laba Kotor', Amount: grossProfit },
      { Category: 'Beban Operasional', Amount: -expenses },
      { Category: 'Laba Bersih', Amount: netProfit },
    ];

    const worksheet = XLSX.utils.json_to_sheet([]);

    // Period Header
    const period = `Periode: ${dateRange?.from ? format(dateRange.from, "dd MMM yyyy") : ''} - ${dateRange?.to ? format(dateRange.to, "dd MMM yyyy") : ''}`;
    XLSX.utils.sheet_add_aoa(worksheet, [["Laporan Laba Rugi"], [period], []], { origin: "A1" });
    
    // Add data with headers
    XLSX.utils.sheet_add_json(worksheet, data, { origin: "A4" });

    // Apply formatting
    data.forEach((row, index) => {
        const rowIndex = index + 5; // Data starts at row 5 after headers
        
        // Bold for totals
        if (row.Category.includes('Laba Kotor') || row.Category.includes('Laba Bersih')) {
            worksheet[`A${rowIndex}`].s = { font: { bold: true } };
            worksheet[`B${rowIndex}`].s = { font: { bold: true } };
        }

        // Accounting format for numbers
        const cell = worksheet[`B${rowIndex}`];
        if (cell) {
             cell.z = `_("Rp"* #,##0_);_("Rp"* (#,##0);_("Rp"* "-"??_);_(@_)`;
             if (cell.v < 0) {
                 cell.s = { ...cell.s, font: { ...cell.s?.font, color: { rgb: "FF0000" } } };
             }
        }
    });

    worksheet['!cols'] = [{ wch: 30 }, { wch: 25 }];
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laba Rugi");
    
    XLSX.writeFile(workbook, `Laporan_Laba_Rugi_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };
  
   const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    setIsDownloadingPdf(true);
    
    try {
        const canvas = await html2canvas(reportRef.current, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');

        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'pt',
            format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = imgWidth / imgHeight;
        
        let widthInPdf = pdfWidth - 80; // Add some margin
        let heightInPdf = widthInPdf / ratio;

        if (heightInPdf > pdfHeight - 80) {
            heightInPdf = pdfHeight - 80;
            widthInPdf = heightInPdf * ratio;
        }

        const x = (pdfWidth - widthInPdf) / 2;
        const y = 40;

        pdf.addImage(imgData, 'PNG', x, y, widthInPdf, heightInPdf);
        pdf.save(`Laporan_Laba_Rugi_${format(new Date(), 'yyyy-MM-dd')}.pdf`);

    } catch (error) {
        console.error("Error generating PDF", error);
        toast({ variant: 'destructive', title: 'Gagal Membuat PDF', description: 'Terjadi kesalahan saat membuat file PDF.'})
    } finally {
        setIsDownloadingPdf(false);
    }
  };


  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl font-headline">Laporan Laba Rugi</h1>
        <div className="ml-auto flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={isFetching || isDownloadingPdf}>
                  {isDownloadingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                  Download Laporan
                  <ChevronsUpDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDownloadExcel}>
                  <FileDown className="mr-2 h-4 w-4" />
                  <span>Download Excel</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownloadPdf}>
                   <FileDown className="mr-2 h-4 w-4" />
                   <span>Download PDF</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

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

      <Card ref={reportRef} className="p-2 sm:p-6">
        <CardHeader>
            <CardTitle>Laporan Laba Rugi</CardTitle>
            <CardDescription>
                Ringkasan pendapatan dan pengeluaran untuk periode 
                <span className="font-semibold"> {dateRange?.from ? format(dateRange.from, "dd MMM yyyy") : ''} - {dateRange?.to ? format(dateRange.to, "dd MMM yyyy") : ''}</span>.
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
                        <span className={cn(netProfit < 0 ? 'text-red-500' : '')}>Rp{netProfit.toLocaleString('id-ID')}</span>
                    </div>

                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
