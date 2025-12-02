"use client";

import React, { useEffect } from 'react';
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
import { PlusCircle, Eye, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { useStockOpnameStore } from '@/store/stock-opname-store';
import { StockOpname, StockOpnameStatus } from '@/lib/types';
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { useDebounce } from 'use-debounce';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function StockOpnamePage() {
  const router = useRouter();
  const { 
    stockOpnames, 
    isFetching,
    fetchStockOpnames,
    page,
    limit,
    total,
    searchTerm,
    setPage,
    setLimit,
    setSearchTerm
  } = useStockOpnameStore();

  const [debouncedSearch] = useDebounce(searchTerm, 300);
  const totalPages = Math.ceil(total / limit);

  useEffect(() => {
    fetchStockOpnames();
  }, [fetchStockOpnames, page, limit, debouncedSearch]);
  
  const getStatusVariant = (status: StockOpnameStatus): "default" | "secondary" => {
    return status === 'SELESAI' ? 'default' : 'secondary';
  }

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl font-headline">Stock Opname</h1>
        <div className="ml-auto flex items-center gap-2">
            <Button size="sm" className="h-8 gap-1" asChild>
                <Link href="/user/inventory/stock-opname/new">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Buat Stock Opname
                    </span>
                </Link>
            </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Riwayat Stock Opname</CardTitle>
            <CardDescription>Daftar semua kegiatan penyesuaian stok yang telah dilakukan.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Cari no. referensi atau catatan..."
                  className="pl-8 sm:w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>No. Referensi</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Catatan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {isFetching ? (
                  Array.from({ length: limit }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-10 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : stockOpnames.map((opname: StockOpname) => (
                    <TableRow key={opname.id}>
                        <TableCell className="font-medium font-mono text-xs">{opname.nomor_referensi}</TableCell>
                        <TableCell>{format(new Date(opname.tanggal), "dd MMM yyyy")}</TableCell>
                        <TableCell>{opname.catatan}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(opname.status)}>{opname.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => router.push(`/user/inventory/stock-opname/${opname.id}`)}>
                                        <Eye className="h-4 w-4" />
                                        <span className="sr-only">Lihat Detail</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Lihat Detail</p>
                                </TooltipContent>
                            </Tooltip>
                           </TooltipProvider>
                        </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Menampilkan {stockOpnames.length} dari {total} data.
              </div>
              <div className='flex items-center gap-4'>
                 <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">Baris per halaman</p>
                    <Select
                        value={`${limit}`}
                        onValueChange={(value) => { setLimit(Number(value)) }}
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
    </div>
  )
}
