
"use client";

import { useForm } from "react-hook-form";
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
import { useState } from "react";

const suratJalanSchema = z.object({
  vehicleNumber: z.string().min(1, "Nomor kendaraan wajib diisi"),
});

type SuratJalanFormValues = z.infer<typeof suratJalanSchema>;

interface SuratJalanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (vehicleNumber: string) => void;
}

export function SuratJalanModal({ isOpen, onClose, onSubmit }: SuratJalanModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<SuratJalanFormValues>({
    resolver: zodResolver(suratJalanSchema),
    defaultValues: { vehicleNumber: "" },
  });

  const handleFormSubmit = async (data: SuratJalanFormValues) => {
    setIsSubmitting(true);
    await onSubmit(data.vehicleNumber);
    setIsSubmitting(false);
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Cetak Surat Jalan</DialogTitle>
          <DialogDescription>
            Masukkan nomor kendaraan untuk melengkapi Surat Jalan.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="vehicleNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nomor Kendaraan</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: B 1234 XYZ" {...field} disabled={isSubmitting} />
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
                Lanjutkan & Cetak
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
