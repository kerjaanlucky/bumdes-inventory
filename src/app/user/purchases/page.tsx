
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
import { PlusCircle, Edit, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { useDebounce } from 'use-debounce';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmationDialog } from '@/components/common/confirmation-dialog';
import { usePurchaseStore } from '@/store/purchase-store';
import { Purchase, PurchaseStatus } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function PurchasesPage() {
    const router = useRouter();
    const { 
      purchases, 
      total, 
      page, 
      limit, 
      searchTerm,
      isFetching,
      isDeleting,
      fetchPurchases,
      setSearchTerm,
      setPage,
      setLimit,
      deletePurchase,
    } = usePurchaseStore();
    
    const [debouncedSearch] = useDebounce(searchTerm, 300);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedPurchase, setSelectedPurchase] = useState<number | null>(null);

    useEffect(() => {
      fetchPurchases();
    }, [fetchPurchases, debouncedSearch, page, limit]);

    const handleDeleteClick = (purchaseId: number) => {
      setSelectedPurchase(purchaseId);
      setDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
      if (selectedPurchase) {
        await deletePurchase(selectedPurchase);
        setDialogOpen(false);
        setSelectedPurchase(null);
      }
    };
    
    const getStatusVariant = (status: PurchaseStatus): "default" | "secondary" | "destructive" | "outline" => {
        switch (status) {
            case "DITERIMA_PENUH": return "default";
            case "DIPESAN": return "secondary";
            case "DRAFT": return "outline";
            case "DITERIMA_SEBAGIAN": return "secondary";
            case "DIBATALKAN": return "destructive";
            default: return "outline";
        }
    }

    const totalPages = Math.ceil(total / limit);

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl font-headline">Manajemen Pembelian</h1>
        <div className="ml-auto flex items-center gap-2">
            <Button size="sm" className="h-8 gap-1" asChild>
                <Link href="/user/purchases/new">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Tambah Pembelian
                    </span>
                </Link>
            </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Pesanan Pembelian</CardTitle>
            <CardDescription>Lacak dan kelola pesanan pembelian Anda.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Cari no. pembelian atau pemasok..."
                  className="pl-8 sm:w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>No. Pembelian</TableHead>
                    <TableHead>Pemasok</TableHead>
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
                ) : purchases.map((purchase: Purchase) => (
                    <TableRow key={purchase.id}>
                        <TableCell className="font-medium font-mono text-xs">{purchase.nomor_pembelian}</TableCell>
                        <TableCell>{purchase.nama_supplier}</TableCell>
                        <TableCell>{format(new Date(purchase.tanggal_pembelian), "dd MMM yyyy")}</TableCell>
                        <TableCell>Rp{purchase.total_harga.toLocaleString('id-ID')}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(purchase.status)}>{purchase.status.replace('_', ' ')}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <TooltipProvider>
                            <div className="flex items-center justify-end gap-2">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" onClick={() => router.push(`/user/purchases/${purchase.id}/edit`)}>
                                            <Edit className="h-4 w-4" />
                                            <span className="sr-only">Ubah</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Ubah Pembelian</p>
                                    </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(purchase.id)}>
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Hapus</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Hapus Pembelian</p>
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
                Menampilkan {purchases.length} dari {total} pembelian.
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
        description="Tindakan ini tidak bisa dibatalkan. Ini akan menghapus data pembelian secara permanen."
        isSubmitting={isDeleting}
      />
    </div>
  )
}
