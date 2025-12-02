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
import { PlusCircle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { useStockOpnameStore } from '@/store/stock-opname-store';
import { StockOpname, StockOpnameStatus } from '@/lib/types';
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';

export default function StockOpnamePage() {
  const router = useRouter();
  const { 
    stockOpnames, 
    isFetching,
    fetchStockOpnames,
  } = useStockOpnameStore();

  useEffect(() => {
    fetchStockOpnames();
  }, [fetchStockOpnames]);
  
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
                  Array.from({ length: 5 }).map((_, index) => (
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
            {/* Add pagination here if needed */}
        </CardContent>
      </Card>
    </div>
  )
}
