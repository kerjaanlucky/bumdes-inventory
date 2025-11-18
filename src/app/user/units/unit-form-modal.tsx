"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";

const unitSchema = z.object({
  nama_satuan: z.string().min(1, "Nama satuan wajib diisi"),
});

type UnitFormValues = z.infer<typeof unitSchema>;

interface UnitFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: UnitFormValues) => Promise<void>;
  defaultValue?: UnitFormValues;
  isSubmitting?: boolean;
}

export function UnitFormModal({
  isOpen,
  onClose,
  onSubmit,
  defaultValue,
  isSubmitting = false
}: UnitFormModalProps) {
  const form = useForm<UnitFormValues>({
    resolver: zodResolver(unitSchema),
    defaultValues: defaultValue || { nama_satuan: "" },
  });

  const handleFormSubmit: SubmitHandler<UnitFormValues> = async (data) => {
    await onSubmit(data);
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{defaultValue ? "Ubah Satuan" : "Tambah Satuan Baru"}</DialogTitle>
          <DialogDescription>
            {defaultValue ? "Perbarui detail satuan." : "Isi nama untuk satuan baru."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="nama_satuan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Satuan</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: Unit, Pcs, Box" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {defaultValue ? "Simpan Perubahan" : "Tambah Satuan"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
