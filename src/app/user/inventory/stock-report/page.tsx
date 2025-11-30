
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { History, Package } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { useStockStore } from '@/store/stock-store';
import { Product, StockMovement } from '@/lib/types';
import { format } from 'date-fns';
import { useDebounce } from 'use-debounce';
import SearchableSelect from '@/components/ui/searchable-select';
import { useProductStore } from '@/store/product-store';

export default function StockReportPage() {
    const { 
      movements, 
      isFetching: isMovementsFetching,
      fetchMovements,
    } = useStockStore();
    
    const { 
        products, 
        fetchProducts,
        isFetching: isProductsFetching,
    } = useProductStore();

    const [productSearch, setProductSearch] = useState('');
    const [selectedProductId, setSelectedProductId] = useState<string>('');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    const [debouncedProductSearch] = useDebounce(productSearch, 300);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts, debouncedProductSearch]);

    useEffect(() => {
        if (selectedProductId) {
            const product = products.find(p => p.id === selectedProductId);
            setSelectedProduct(product || null);
            fetchMovements(selectedProductId);
        } else {
            setSelectedProduct(null);
            useStockStore.setState({ movements: [], total: 0 });
        }
    }, [selectedProductId, products, fetchMovements]);

    const productOptions = useMemo(() => 
        products.map(p => ({ value: p.id, label: `${p.kode_produk} - ${p.nama_produk}` })), 
        [products]
    );

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl font-headline">Laporan Stok per Produk</h1>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Pilih Produk</CardTitle>
            <CardDescription>Cari dan pilih produk untuk melihat detail dan riwayat stoknya.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="max-w-md">
                <SearchableSelect
                    options={productOptions}
                    value={selectedProductId}
                    onChange={setSelectedProductId}
                    onSearchChange={setProductSearch}
                    placeholder="Cari produk..."
                    isLoading={isProductsFetching}
                />
            </div>
        </CardContent>
      </Card>

      {selectedProduct && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-1">
                <CardHeader>
                    <CardTitle>{selectedProduct.nama_produk}</CardTitle>
                    <CardDescription>{selectedProduct.kode_produk}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className='flex justify-between items-center'>
                        <span className='text-sm text-muted-foreground'>Stok Saat Ini</span>
                        <span className='font-bold text-2xl'>{selectedProduct.stok} <span className='text-sm font-normal'>{selectedProduct.nama_satuan}</span></span>
                    </div>
                     <div className='flex justify-between items-center'>
                        <span className='text-sm text-muted-foreground'>Harga Modal</span>
                        <span className='font-semibold'>Rp{selectedProduct.harga_modal.toLocaleString('id-ID')}</span>
                    </div>
                     <div className='flex justify-between items-center'>
                        <span className='text-sm text-muted-foreground'>Harga Jual</span>
                        <span className='font-semibold'>Rp{selectedProduct.harga_jual.toLocaleString('id-ID')}</span>
                    </div>
                     <div className='flex justify-between items-center'>
                        <span className='text-sm text-muted-foreground'>Kategori</span>
                        <span className='font-semibold'>{selectedProduct.nama_kategori}</span>
                    </div>
                </CardContent>
            </Card>

            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Riwayat Pergerakan</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>Tipe</TableHead>
                            <TableHead>Jumlah</TableHead>
                            <TableHead>Stok Akhir</TableHead>
                            <TableHead>Referensi</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {isMovementsFetching ? (
                        Array.from({ length: 5 }).map((_, index) => (
                            <TableRow key={index}>
                                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
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
                            <TableCell colSpan={5} className="h-24 text-center">
                                <History className="mx-auto h-8 w-8 text-muted-foreground" />
                                <p className="mt-2 text-muted-foreground">Belum ada pergerakan stok untuk produk ini.</p>
                            </TableCell>
                        </TableRow>
                        )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
      )}
       {!selectedProductId && (
         <Card>
            <CardContent className="py-24">
                <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
                    <Package className="h-12 w-12" />
                    <h3 className="text-xl font-bold tracking-tight">
                        Pilih produk untuk memulai
                    </h3>
                    <p className="text-sm">
                       Gunakan kotak pencarian di atas untuk menemukan produk dan melihat laporannya.
                    </p>
                </div>
            </CardContent>
         </Card>
      )}

    </div>
  )
}
