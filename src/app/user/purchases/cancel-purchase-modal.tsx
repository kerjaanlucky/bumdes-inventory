"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { Purchase } from "@/lib/types";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertTriangle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

const cancelPurchaseSchema = z.object({
  reason: z.string().optional(),
});

type CancelPurchaseFormValues = z.infer<typeof cancelPurchaseSchema>;

interface CancelPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => Promise<void>;
  purchase: Purchase | null;
  isSubmitting?: boolean;
}

export function CancelPurchaseModal({
  isOpen,
  onClose,
  onConfirm,
  purchase,
  isSubmitting = false,
}: CancelPurchaseModalProps) {
  const form = useForm<CancelPurchaseFormValues>({
    defaultValues: { reason: "" },
  });

  if (!purchase) return null;

  const itemsReceived = (purchase.items || []).filter(item => (item.jumlah_diterima || 0) > 0);
  const hasReceivedItems = itemsReceived.length > 0;

  const handleFormSubmit: SubmitHandler<CancelPurchaseFormValues> = async (data) => {
    await onConfirm(data.reason);
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Batalkan Pesanan Pembelian?
          </DialogTitle>
          <DialogDescription>
            Pesanan <span className="font-mono font-semibold">{purchase.nomor_pembelian}</span> akan diubah statusnya menjadi <strong>DIBATALKAN</strong>.
          </DialogDescription>
        </DialogHeader>

        {hasReceivedItems ? (
          <Alert variant="destructive" className="bg-destructive/10 border-destructive/30 text-destructive dark:text-red-400">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="font-semibold text-sm">Penyesuaian Stok Otomatis</AlertTitle>
            <AlertDescription className="text-xs space-y-1 mt-1">
              <p>
                Pesanan ini sudah memiliki barang yang diterima. Membatalkan pesanan ini akan <strong>menarik kembali (mengurangi)</strong> stok barang yang telah masuk:
              </p>
              <ul className="list-disc pl-4 space-y-0.5 mt-1 font-mono">
                {itemsReceived.map((item) => (
                  <li key={item.id}>
                    {item.nama_produk}: <strong>-{item.jumlah_diterima} {item.nama_satuan}</strong>
                  </li>
                ))}
              </ul>
              <p className="mt-1 text-muted-foreground italic">
                Riwayat pergerakan stok ("Pembatalan Pembelian") akan otomatis dicatat sebagai bukti audit.
              </p>
            </AlertDescription>
          </Alert>
        ) : (
          <p className="text-sm text-muted-foreground">
            Karena belum ada barang yang diterima pada pesanan ini, pembatalan tidak akan memengaruhi stok gudang.
          </p>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alasan Pembatalan (Opsional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Contoh: Kesalahan pesanan / Supplier membatalkan pengiriman / Salah input nota."
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Kembali
              </Button>
              <Button type="submit" variant="destructive" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Ya, Batalkan Pesanan
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
