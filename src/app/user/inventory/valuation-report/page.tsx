"use client";

import React, { useEffect, useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Download, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { useStockStore, StockValuationItem } from '@/store/stock-store';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfirmationDialog } from '@/components/common/confirmation-dialog';
import * as XLSX from 'xlsx';


export default function StockValuationReportPage() {
    const { 
        valuationReport,
        isFetching,
        fetchStockValuationReport,
        reportDate,
        setReportDate,
        setLimit,
        limit,
        page,
        setPage,
        total
    } = useStockStore();
    
    const [isAlertOpen, setAlertOpen] = useState(false);
    const [selectedLimit, setSelectedLimit] = useState(limit);

    useEffect(() => {
        fetchStockValuationReport();
    }, [reportDate, page, limit, fetchStockValuationReport]);

    const handleLimitChange = (value: string) => {
        const newLimit = value === 'all' ? total : Number(value);
        if (value === 'all') {
            setSelectedLimit('all');
            setAlertOpen(true);
        } else {
            setSelectedLimit(newLimit);
            setLimit(newLimit);
        }
    };
    
    const handleConfirmFetchAll = () => {
        setLimit(total);
        setAlertOpen(false);
    }

    const totalPages = Math.ceil((valuationReport?.totalProducts || 0) / limit);

    const handleDownloadExcel = () => {
        if (!valuationReport?.paginatedItems) return;
        
        const dataToExport = valuationReport.paginatedItems.map(item => ({
            "Kode Produk": item.kode_produk,
            "Nama Produk": item.nama_produk,
            "Stok": item.stock,
            "Harga Modal": item.harga_modal,
            "Total Nilai": item.total_value,
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Nilai Stok");
        
        // Add summary footer
         XLSX.utils.sheet_add_aoa(worksheet, [
            [],
            ["Total Item", valuationReport.summary.totalItems],
            ["Total Stok Keseluruhan", valuationReport.summary.totalStock],
            ["Total Nilai Persediaan (Rp)", valuationReport.summary.totalValue],
        ], { origin: -1 });

        XLSX.writeFile(workbook, `Laporan_Nilai_Stok_${format(reportDate, 'yyyy-MM-dd')}.xlsx`);
    };

    return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl font-headline">Laporan Nilai Stok</h1>
        <div className="ml-auto flex items-center gap-2">
            <Button onClick={handleDownloadExcel} variant="outline" disabled={isFetching || !valuationReport?.paginatedItems.length}>
                <Download className="mr-2 h-4 w-4" />
                Download Excel
            </Button>
        </div>
      </div>
      
       <Card>
        <CardHeader>
            <CardTitle>Filter Laporan</CardTitle>
            <div className="flex items-center justify-between">
                <CardDescription>Pilih tanggal akhir untuk melihat nilai persediaan Anda.</CardDescription>
                 <div className='flex items-center gap-4'>
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">Tampilkan</p>
                        <Select
                            value={String(selectedLimit)}
                            onValueChange={handleLimitChange}
                            disabled={isFetching}
                        >
                            <SelectTrigger className="h-8 w-[100px]">
                                <SelectValue placeholder={limit} />
                            </SelectTrigger>
                            <SelectContent side="top">
                                {[50, 100, 250].map((pageSize) => (
                                    <SelectItem key={pageSize} value={`${pageSize}`}>
                                        {pageSize}
                                    </SelectItem>
                                ))}
                                <SelectItem value="all">Semua</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant={"outline"}
                            className={cn(
                            "w-[200px] justify-start text-left font-normal",
                            !reportDate && "text-muted-foreground"
                            )}
                             disabled={isFetching}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {reportDate ? format(reportDate, "PPP") : (<span>Pilih tanggal</span>)}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                            initialFocus
                            mode="single"
                            selected={reportDate}
                            onSelect={(date) => date && setReportDate(date)}
                            disabled={(date) => date > new Date()}
                        />
                        </PopoverContent>
                    </Popover>
                 </div>
            </div>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Kode Produk</TableHead>
                    <TableHead>Nama Produk</TableHead>
                    <TableHead className="text-right">Stok</TableHead>
                    <TableHead className="text-right">Harga Modal</TableHead>
                    <TableHead className="text-right font-semibold">Total Nilai</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {isFetching ? (
                  Array.from({ length: 10 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-5 w-28 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : valuationReport && valuationReport.paginatedItems.length > 0 ? (
                  valuationReport.paginatedItems.map((item: StockValuationItem) => (
                    <TableRow key={item.id}>
                        <TableCell className="font-mono text-xs">{item.kode_produk}</TableCell>
                        <TableCell className="font-medium">{item.nama_produk}</TableCell>
                        <TableCell className="text-right">{item.stock}</TableCell>
                        <TableCell className="text-right">Rp{item.harga_modal.toLocaleString('id-ID')}</TableCell>
                        <TableCell className="text-right font-semibold">Rp{item.total_value.toLocaleString('id-ID')}</TableCell>
                    </TableRow>
                ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                             {isFetching ? <Loader2 className="h-8 w-8 animate-spin mx-auto"/> : 'Tidak ada data produk untuk ditampilkan.'}
                        </TableCell>
                    </TableRow>
                )}
                </TableBody>
                 {valuationReport && valuationReport.paginatedItems.length > 0 && (
                    <TableFooter>
                        <TableRow className="font-bold text-base bg-muted/50">
                            <TableCell colSpan={2}>Total Keseluruhan</TableCell>
                            <TableCell className="text-right">{valuationReport.summary.totalStock.toLocaleString('id-ID')}</TableCell>
                            <TableCell colSpan={1}></TableCell>
                            <TableCell className="text-right">Rp{valuationReport.summary.totalValue.toLocaleString('id-ID')}</TableCell>
                        </TableRow>
                    </TableFooter>
                 )}
            </Table>
             <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1 || isFetching}
                >
                    Sebelumnya
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages || isFetching}
                >
                    Berikutnya
                </Button>
            </div>
        </CardContent>
       </Card>
        <ConfirmationDialog
            isOpen={isAlertOpen}
            onClose={() => setAlertOpen(false)}
            onConfirm={handleConfirmFetchAll}
            title="Tampilkan Semua Data?"
            description="Tindakan ini akan memuat semua data produk dan menghitung stok untuk setiap item. Proses ini mungkin memakan waktu beberapa saat tergantung pada jumlah data Anda. Lanjutkan?"
        />
    </div>
    );
}
