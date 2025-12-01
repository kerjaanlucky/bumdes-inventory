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
import { useCustomerStore } from '@/store/customer-store';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Customer } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';

const customerSchema = z.object({
  nama_customer: z.string().min(1, 'Nama pelanggan wajib diisi'),
  alamat: z.string().optional(),
  telepon: z.string().optional(),
  email: z.string().email({ message: "Alamat email tidak valid" }).optional().or(z.literal('')),
});

type CustomerSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (newCustomer: Customer) => void;
};

export function CustomerSheet({
  open,
  onOpenChange,
  onSuccess,
}: CustomerSheetProps) {
  
  const { addCustomer, isSubmitting } = useCustomerStore();

  const form = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      nama_customer: '',
      alamat: '',
      telepon: '',
      email: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof customerSchema>) => {
    try {
      const newCustomer = await useCustomerStore.getState().addCustomer(values);
      if (newCustomer) {
        toast({ title: 'Pelanggan Ditambahkan' });
        onSuccess(newCustomer);
        form.reset();
      } else {
        throw new Error("Failed to create customer or return value was undefined.");
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Gagal',
        description: `Gagal menambahkan pelanggan.`,
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            Tambah Pelanggan Baru
          </SheetTitle>
          <SheetDescription>
            Buat pelanggan baru. Setelah disimpan, ini akan tersedia untuk dipilih.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-8"
          >
            <FormField
              control={form.control}
              name="nama_customer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Pelanggan</FormLabel>
                  <FormControl>
                    <Input placeholder="Budi Santoso" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="budi@example.com" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="telepon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telepon</FormLabel>
                  <FormControl>
                    <Input placeholder="08123456789" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="alamat"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alamat</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Jl. Pahlawan No. 123" {...field} disabled={isSubmitting} />
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
