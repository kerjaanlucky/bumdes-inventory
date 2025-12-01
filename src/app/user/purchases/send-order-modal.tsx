
"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";

const sendOrderSchema = z.object({
  note: z.string().optional(),
});

type SendOrderFormValues = z.infer<typeof sendOrderSchema>;

interface SendOrderConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (note?: string) => Promise<void>;
  purchaseNumber: string;
  isSubmitting?: boolean;
}

export function SendOrderConfirmationModal({
  isOpen,
  onClose,
  onSubmit,
  purchaseNumber,
  isSubmitting = false
}: SendOrderConfirmationModalProps) {
  const form = useForm<SendOrderFormValues>({
    defaultValues: { note: "" },
  });

  const handleFormSubmit: SubmitHandler<SendOrderFormValues> = async (data) => {
    await onSubmit(data.note);
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Kirim Pesanan Pembelian?</DialogTitle>
          <DialogDescription>
            Tindakan ini akan mengubah status pesanan <span className="font-mono">{purchaseNumber}</span> menjadi "DIPESAN". Anda tidak dapat mengedit pesanan setelah dikirim.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catatan (Opsional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Contoh: Tolong proses segera." {...field} disabled={isSubmitting} />
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
                Ya, Kirim Pesanan
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
