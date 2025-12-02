"use client";

import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, PlusCircle, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUnitStore } from '@/store/unit-store';
import { ConfirmationDialog } from '@/components/common/confirmation-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { useDebounce } from 'use-debounce';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UnitFormModal } from './unit-form-modal';
import { Unit } from '@/lib/types';

export default function UnitsPage() {
  const { 
    units, 
    total, 
    page, 
    limit, 
    searchTerm,
    isFetching,
    isDeleting,
    fetchUnits,
    setSearchTerm,
    setPage,
    setLimit,
    deleteUnit,
    addUnit,
    editUnit,
  } = useUnitStore();
  const { toast } = useToast();
  const [debouncedSearch] = useDebounce(searchTerm, 300);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [formModalOpen, setFormModalOpen] = useState(false);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits, debouncedSearch, page, limit]);

  const handleDeleteClick = (unit: Unit) => {
    setSelectedUnit(unit);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedUnit) {
      await deleteUnit(selectedUnit.id);
      setDeleteDialogOpen(false);
      setSelectedUnit(null);
      toast({
        title: "Satuan Dihapus",
        description: "Satuan telah berhasil dihapus.",
      });
    }
  };

  const handleEditClick = (unit: Unit) => {
    setSelectedUnit(unit);
    setFormModalOpen(true);
  };

  const handleAddClick = () => {
    setSelectedUnit(null);
    setFormModalOpen(true);
  };
  
  const handleFormSubmit = async (values: { nama_satuan: string }) => {
    if (selectedUnit) {
      await editUnit({ ...selectedUnit, nama_satuan: values.nama_satuan });
      toast({
        title: "Satuan Diperbarui",
        description: "Perubahan pada satuan telah berhasil disimpan.",
      });
    } else {
      await addUnit(values);
       toast({
        title: "Satuan Ditambahkan",
        description: "Satuan baru telah berhasil ditambahkan.",
      });
    }
    setFormModalOpen(false);
    setSelectedUnit(null);
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl font-headline">Manajemen Satuan</h1>
        <div className="ml-auto flex items-center gap-2">
            <Button size="sm" className="h-8 gap-1" onClick={handleAddClick}>
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Tambah Satuan
                </span>
            </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Satuan Produk</CardTitle>
            <CardDescription>Kelola satuan (unit) untuk produk Anda.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Cari satuan..."
                  className="pl-8 sm:w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead className="w-[80px]">No.</TableHead>
                    <TableHead>Nama Satuan</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {isFetching ? (
                  Array.from({ length: limit }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-5 w-10" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : units.map((unit, index) => (
                    <TableRow key={unit.id}>
                        <TableCell>{(page - 1) * limit + index + 1}</TableCell>
                        <TableCell className="font-medium">{unit.nama_satuan}</TableCell>
                        <TableCell className="text-right">
                          <TooltipProvider>
                            <div className="flex items-center justify-end gap-2">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(unit)}>
                                            <Edit className="h-4 w-4" />
                                            <span className="sr-only">Ubah</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Ubah Satuan</p>
                                    </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(unit)}>
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Hapus</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Hapus Satuan</p>
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
                Menampilkan {units.length} dari {total} satuan.
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
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Apakah Anda yakin?"
        description="Tindakan ini tidak bisa dibatalkan. Ini akan menghapus satuan secara permanen."
        isSubmitting={isDeleting}
      />
      {formModalOpen && (
        <UnitFormModal 
            isOpen={formModalOpen}
            onClose={() => setFormModalOpen(false)}
            onSubmit={handleFormSubmit}
            defaultValue={selectedUnit ? { nama_satuan: selectedUnit.nama_satuan } : undefined}
            isSubmitting={useUnitStore.getState().isSubmitting}
        />
      )}
    </div>
  )
}
