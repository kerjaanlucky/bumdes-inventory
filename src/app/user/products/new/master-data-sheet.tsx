'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useCategoryStore } from '@/store/category-store';
import { useUnitStore } from '@/store/unit-store';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const categorySchema = z.object({
  nama_kategori: z.string().min(1, 'Nama kategori wajib diisi'),
});

const unitSchema = z.object({
  nama_satuan: z.string().min(1, 'Nama satuan wajib diisi'),
});

type MasterDataSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'category' | 'unit';
  onSuccess: () => void;
};

export function MasterDataSheet({
  open,
  onOpenChange,
  type,
  onSuccess,
}: MasterDataSheetProps) {
  const isCategory = type === 'category';
  const formSchema = isCategory ? categorySchema : unitSchema;

  const { addCategory, isSubmitting: isSubmittingCategory } = useCategoryStore();
  const { addUnit, isSubmitting: isSubmittingUnit } = useUnitStore();

  const isSubmitting = isSubmittingCategory || isSubmittingUnit;

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: isCategory ? { nama_kategori: '' } : { nama_satuan: '' },
  });

  const onSubmit = async (values: any) => {
    try {
      if (isCategory) {
        await addCategory(values);
        toast({ title: 'Kategori Ditambahkan' });
      } else {
        await addUnit(values);
        toast({ title: 'Satuan Ditambahkan' });
      }
      form.reset();
      onSuccess(); // Re-fetch parent dropdown data
      onOpenChange(false); // Close sheet on success
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Gagal',
        description: `Gagal menambahkan ${isCategory ? 'kategori' : 'satuan'}.`,
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            Tambah {isCategory ? 'Kategori' : 'Satuan'} Baru
          </SheetTitle>
          <SheetDescription>
            Buat {isCategory ? 'kategori' : 'satuan'} baru. Setelah disimpan,
            ini akan tersedia untuk dipilih.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-8 py-8"
          >
            <FormField
              control={form.control}
              name={isCategory ? 'nama_kategori' : 'nama_satuan'}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Nama {isCategory ? 'Kategori' : 'Satuan'}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        isCategory
                          ? 'Contoh: Pakaian'
                          : 'Contoh: Lusin'
                      }
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <SheetFooter>
              <SheetClose asChild>
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  Batal
                </Button>
              </SheetClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Simpan
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
