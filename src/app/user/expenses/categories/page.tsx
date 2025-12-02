
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
import { Edit, PlusCircle, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useExpenseCategoryStore } from '@/store/expense-store';
import { ConfirmationDialog } from '@/components/common/confirmation-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { CategoryFormModal } from './category-form-modal';
import { ExpenseCategory } from '@/lib/types';
import { useRouter } from 'next/navigation';

export default function ExpenseCategoriesPage() {
  const router = useRouter();
  const { 
    expenseCategories,
    isFetching,
    isSubmitting,
    isDeleting,
    fetchExpenseCategories,
    addExpenseCategory,
    editExpenseCategory,
    deleteExpenseCategory,
  } = useExpenseCategoryStore();
  const { toast } = useToast();
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null);
  const [formModalOpen, setFormModalOpen] = useState(false);

  useEffect(() => {
    fetchExpenseCategories();
  }, [fetchExpenseCategories]);

  const handleDeleteClick = (category: ExpenseCategory) => {
    setSelectedCategory(category);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedCategory) {
      await deleteExpenseCategory(selectedCategory.id);
      toast({ title: "Kategori Dihapus" });
      setDeleteDialogOpen(false);
      setSelectedCategory(null);
    }
  };

  const handleEditClick = (category: ExpenseCategory) => {
    setSelectedCategory(category);
    setFormModalOpen(true);
  };

  const handleAddClick = () => {
    setSelectedCategory(null);
    setFormModalOpen(true);
  };
  
  const handleFormSubmit = async (values: { nama_kategori: string }) => {
    if (selectedCategory) {
      await editExpenseCategory({ ...selectedCategory, nama_kategori: values.nama_kategori });
      toast({ title: "Kategori Diperbarui" });
    } else {
      await addExpenseCategory(values);
      toast({ title: "Kategori Ditambahkan" });
    }
    setFormModalOpen(false);
    setSelectedCategory(null);
  }

  return (
    <div className="flex flex-col gap-4 py-4">
       <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Kembali</span>
        </Button>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
           Manajemen Kategori Biaya
        </h1>
        <div className="ml-auto flex items-center gap-2">
            <Button size="sm" className="h-8 gap-1" onClick={handleAddClick}>
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Tambah Kategori
                </span>
            </Button>
        </div>
      </div>


      <Card>
        <CardHeader>
            <CardTitle>Kategori Biaya</CardTitle>
            <CardDescription>Kelola kategori untuk pengeluaran operasional Anda.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Nama Kategori</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {isFetching ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : expenseCategories.map((category) => (
                    <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.nama_kategori}</TableCell>
                        <TableCell className="text-right">
                          <TooltipProvider>
                            <div className="flex items-center justify-end gap-2">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(category)}>
                                            <Edit className="h-4 w-4" />
                                            <span className="sr-only">Ubah</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Ubah Kategori</p>
                                    </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(category)}>
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Hapus</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Hapus Kategori</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                           </TooltipProvider>
                        </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
      <ConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Apakah Anda yakin?"
        description="Tindakan ini tidak bisa dibatalkan. Menghapus kategori ini juga akan mempengaruhi laporan biaya yang ada."
        isSubmitting={isDeleting}
      />
      {formModalOpen && (
        <CategoryFormModal 
            isOpen={formModalOpen}
            onClose={() => setFormModalOpen(false)}
            onSubmit={handleFormSubmit}
            defaultValue={selectedCategory ?? undefined}
            isSubmitting={isSubmitting}
        />
      )}
    </div>
  )
}
