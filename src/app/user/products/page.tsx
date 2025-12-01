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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Product, Category } from "@/lib/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { useProductStore } from '@/store/product-store';
import { useCategoryStore } from '@/store/category-store';
import { useDebounce } from 'use-debounce';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmationDialog } from '@/components/common/confirmation-dialog';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';

export default function ProductsPage() {
    const router = useRouter();
    const { 
      products, 
      total, 
      page, 
      limit, 
      searchTerm,
      filterCategoryId,
      isFetching,
      isDeleting,
      fetchProducts,
      setSearchTerm,
      setFilterCategoryId,
      setPage,
      setLimit,
      deleteProduct,
      editProduct
    } = useProductStore();

    const { categories, fetchCategories } = useCategoryStore();
    
    const { toast } = useToast();
    const [debouncedSearch] = useDebounce(searchTerm, 300);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

    useEffect(() => {
      fetchProducts();
    }, [fetchProducts, debouncedSearch, page, limit, filterCategoryId]);
    
    useEffect(() => {
        // Fetch all categories for the filter dropdown
        useCategoryStore.setState({ limit: 1000 }); // Hack to get all categories
        fetchCategories();
    }, [fetchCategories]);


    const getStockStatus = (stock: number): { text: string; variant: "default" | "secondary" | "destructive" } => {
        if (stock <= 0) {
            return { text: "Habis", variant: "destructive" };
        }
        if (stock < 10) {
            return { text: "Stok Rendah", variant: "secondary" };
        }
        return { text: "Tersedia", variant: "default" };
    }

    const totalPages = Math.ceil(total / limit);

    const handleDeleteClick = (productId: string) => {
      setSelectedProduct(productId);
      setDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
      if (selectedProduct) {
        await deleteProduct(selectedProduct);
        setDialogOpen(false);
        setSelectedProduct(null);
        toast({
          title: "Produk Dihapus",
          description: "Produk telah berhasil dihapus.",
        });
      }
    };

    const handleStatusChange = (product: Product, checked: boolean) => {
      const newStatus = checked ? 'Tersedia' : 'Tidak Tersedia';
      editProduct({ ...product, status: newStatus }, true);
    };

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl font-headline">Manajemen Produk</h1>
        <div className="ml-auto flex items-center gap-2">
            <Button size="sm" className="h-8 gap-1" asChild>
                <Link href="/user/products/new">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Tambah Produk
                    </span>
                </Link>
            </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Produk</CardTitle>
            <CardDescription>Kelola produk Anda dan lihat status inventarisnya.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex items-center justify-between mb-4 gap-2">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Cari produk..."
                  className="pl-8 sm:w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
               <Select value={filterCategoryId} onValueChange={setFilterCategoryId}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Semua Kategori" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="">Semua Kategori</SelectItem>
                    {categories.map((cat: Category) => (
                        <SelectItem key={cat.id} value={cat.id}>
                            {cat.nama_kategori}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            </div>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Nama Produk</TableHead>
                    <TableHead>Stok</TableHead>
                    <TableHead>Harga Jual</TableHead>
                    <TableHead>Kategori</TableHead>
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
                      <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-12 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : products.map((product: Product) => {
                    const stockStatus = getStockStatus(product.stok);
                    return (
                        <TableRow key={product.id}>
                            <TableCell className="font-medium">{product.nama_produk}</TableCell>
                            <TableCell>
                                <Badge variant={stockStatus.variant}>{product.stok} {product.nama_satuan}</Badge>
                            </TableCell>
                            <TableCell>Rp{product.harga_jual.toLocaleString('id-ID')}</TableCell>
                            <TableCell>{product.nama_kategori}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                     <Switch
                                        checked={product.status === 'Tersedia'}
                                        onCheckedChange={(checked) => handleStatusChange(product, checked)}
                                        aria-label="Product status"
                                    />
                                    <span className="text-xs text-muted-foreground">{product.status}</span>
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <TooltipProvider>
                                <div className="flex items-center justify-end gap-2">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" onClick={() => router.push(`/user/products/${product.id}/edit`)}>
                                                <Edit className="h-4 w-4" />
                                                <span className="sr-only">Ubah</span>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Ubah Produk</p>
                                        </TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(product.id)}>
                                                <Trash2 className="h-4 w-4" />
                                                <span className="sr-only">Hapus</span>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Hapus Produk</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                               </TooltipProvider>
                            </TableCell>
                        </TableRow>
                    )
                })}
                </TableBody>
            </Table>
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Menampilkan {products.length} dari {total} produk.
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
        description="Tindakan ini tidak bisa dibatalkan. Ini akan menghapus produk secara permanen."
        isSubmitting={isDeleting}
      />
    </div>
  )
}
