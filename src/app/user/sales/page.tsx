
"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusCircle, Trash2, Search, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { useDebounce } from 'use-debounce';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmationDialog } from '@/components/common/confirmation-dialog';
import { useSaleStore } from '@/store/sale-store';
import { Sale } from '@/lib/types';
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';

export default function SalesPage() {
    const router = useRouter();
    const { 
      sales, 
      total, 
      page, 
      limit, 
      searchTerm,
      isFetching,
      isDeleting,
      fetchSales,
      setSearchTerm,
      setPage,
      setLimit,
      deleteSale,
    } = useSaleStore();
    
    const [debouncedSearch] = useDebounce(searchTerm, 300);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedSale, setSelectedSale] = useState<string | null>(null);

    useEffect(() => {
      fetchSales();
    }, [fetchSales, debouncedSearch, page, limit]);

    const handleDeleteClick = (saleId: string) => {
      setSelectedSale(saleId);
      setDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
      if (selectedSale) {
        await deleteSale(selectedSale);
        setDialogOpen(false);
        setSelectedSale(null);
      }
    };
    
    const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
        switch (status) {
            case "LUNAS": return "default";
            case "DRAFT": return "outline";
            case "DIBATALKAN": return "destructive";
            default: return "secondary";
        }
    }

    const totalPages = Math.ceil(total / limit);

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl font-headline">Penjualan</h1>
        <div className="ml-auto flex items-center gap-2">
            <Button size="sm" className="h-8 gap-1" asChild>
                <Link href="/user/sales/new">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Penjualan Baru
                    </span>
                </Link>
            </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Transaksi Penjualan</CardTitle>
            <CardDescription>Catat dan kelola penjualan Anda.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Cari no. penjualan atau pelanggan..."
                  className="pl-8 sm:w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>No. Penjualan</TableHead>
                    <TableHead>Pelanggan</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                      <span className="sr-only">Aksi</span>
                    </TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {isFetching ? (
                  Array.from({ length: limit }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : sales.map((sale: Sale) => (
                    <TableRow key={sale.id}>
                        <TableCell className="font-medium font-mono text-xs">{sale.nomor_penjualan}</TableCell>
                        <TableCell>{sale.nama_customer}</TableCell>
                        <TableCell>{format(new Date(sale.tanggal_penjualan), "dd MMM yyyy")}</TableCell>
                        <TableCell>Rp{sale.total_harga.toLocaleString('id-ID')}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(sale.status)}>{sale.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <TooltipProvider>
                            <div className="flex items-center justify-end gap-2">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" onClick={() => { /* router.push(`/user/sales/${sale.id}`) */ }}>
                                            <Eye className="h-4 w-4" />
                                            <span className="sr-only">Lihat Detail</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Lihat Detail</p>
                                    </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(sale.id)}>
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Hapus</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Hapus Penjualan</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                           </TooltipProvider>
                        </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Menampilkan {sales.length} dari {total} penjualan.
              </div>
              <div className='flex items-center gap-4'>
                <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">Baris per halaman</p>
                    <Select
                        value={`${limit}`}
                        onValueChange={(value) => {
                          setLimit(Number(value))
                        }}
                    >
                        <SelectTrigger className="h-8 w-[70px]">
                        <SelectValue placeholder={limit} />
                        </SelectTrigger>
                        <SelectContent side="top">
                        {[5, 10, 25, 50].map((pageSize) => (
                            <SelectItem key={pageSize} value={`${pageSize}`}>
                            {pageSize}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setPage(page - 1); }} aria-disabled={page <= 1} />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <PaginationItem key={p}>
                        <PaginationLink href="#" onClick={(e) => {e.preventDefault(); setPage(p)}} isActive={p === page}>
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext href="#" onClick={(e) => { e.preventDefault(); setPage(page + 1); }} aria-disabled={page >= totalPages} />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </div>
        </CardContent>
      </Card>
      <ConfirmationDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Apakah Anda yakin?"
        description="Tindakan ini tidak dapat dibatalkan. Ini akan menghapus data penjualan secara permanen."
        isSubmitting={isDeleting}
      />
    </div>
  )
}
