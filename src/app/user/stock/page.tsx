"use client";

import React, { useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, History } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { useDebounce } from 'use-debounce';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useStockStore } from '@/store/stock-store';
import { StockMovement } from '@/lib/types';
import { format } from 'date-fns';

export default function StockPage() {
    const { 
      movements, 
      total, 
      page, 
      limit, 
      searchTerm,
      isFetching,
      fetchMovements,
      setSearchTerm,
      setPage,
      setLimit,
    } = useStockStore();
    
    const [debouncedSearch] = useDebounce(searchTerm, 300);

    useEffect(() => {
      fetchMovements();
    }, [fetchMovements, debouncedSearch, page, limit]);

    const totalPages = Math.ceil(total / limit);

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl font-headline">Riwayat Pergerakan Stok</h1>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Pergerakan Stok</CardTitle>
            <CardDescription>Lacak semua perubahan pada level inventaris Anda.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Cari produk atau referensi..."
                  className="pl-8 sm:w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Produk</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Stok Akhir</TableHead>
                    <TableHead>Referensi</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {isFetching ? (
                  Array.from({ length: limit }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    </TableRow>
                  ))
                ) : movements.length > 0 ? (
                  movements.map((move: StockMovement) => (
                    <TableRow key={move.id}>
                        <TableCell>{format(new Date(move.tanggal), "dd MMM yyyy, HH:mm")}</TableCell>
                        <TableCell className="font-medium">{move.nama_produk}</TableCell>
                        <TableCell>{move.tipe}</TableCell>
                        <TableCell className={move.jumlah > 0 ? 'text-green-600' : 'text-red-600'}>
                          {move.jumlah > 0 ? `+${move.jumlah}` : move.jumlah} {move.nama_satuan}
                        </TableCell>
                        <TableCell>{move.stok_akhir} {move.nama_satuan}</TableCell>
                        <TableCell className="font-mono text-xs">{move.referensi}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                        <History className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="mt-2 text-muted-foreground">Belum ada pergerakan stok.</p>
                    </TableCell>
                  </TableRow>
                )}
                </TableBody>
            </Table>
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Menampilkan {movements.length} dari {total} pergerakan.
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
                        {[10, 25, 50, 100].map((pageSize) => (
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
    </div>
  )
}
