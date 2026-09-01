"use client";

import React, { useEffect, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useProductStore } from "@/store/product-store";

const cancelPurchaseSchema = z.object({
  reason: z.string().optional(),
});

type CancelPurchaseFormValues = z.infer<typeof cancelPurchaseSchema>;

interface StockInquiryItem {
  id: string;
  produk_id: string;
  nama_produk: string;
  nama_satuan: string;
  stok_saat_ini: number;
  akan_diretur: number;
  posisi_after: number;
  isMinus: boolean;
}

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
  const [inquiryItems, setInquiryItems] = useState<StockInquiryItem[]>([]);
  const [isLoadingInquiry, setIsLoadingInquiry] = useState(false);
  const [agreeNegativeStock, setAgreeNegativeStock] = useState(false);

  const form = useForm<CancelPurchaseFormValues>({
    defaultValues: { reason: "" },
  });

  useEffect(() => {
    if (isOpen && purchase) {
      setAgreeNegativeStock(false);
      form.reset({ reason: "" });

      const itemsReceived = (purchase.items || []).filter(item => (item.jumlah_diterima || 0) > 0);
      if (itemsReceived.length === 0) {
        setInquiryItems([]);
        return;
      }

      setIsLoadingInquiry(true);
      const { getProductById } = useProductStore.getState();

      Promise.all(
        itemsReceived.map(async (item) => {
          const product = await getProductById(item.produk_id);
          const currentStock = product ? product.stok : 0;
          const returnQty = item.jumlah_diterima;
          const afterStock = currentStock - returnQty;
          return {
            id: item.id || item.produk_id,
            produk_id: item.produk_id,
            nama_produk: item.nama_produk,
            nama_satuan: item.nama_satuan || product?.nama_satuan || "item",
            stok_saat_ini: currentStock,
            akan_diretur: returnQty,
            posisi_after: afterStock,
            isMinus: afterStock < 0,
          };
        })
      )
        .then((results) => {
          setInquiryItems(results);
        })
        .catch((err) => {
          console.error("Error loading stock inquiry:", err);
        })
        .finally(() => {
          setIsLoadingInquiry(false);
        });
    }
  }, [isOpen, purchase, form]);

  if (!purchase) return null;

  const hasReceivedItems = inquiryItems.length > 0;
  const hasMinusStock = inquiryItems.some((item) => item.isMinus);

  const handleFormSubmit: SubmitHandler<CancelPurchaseFormValues> = async (data) => {
    await onConfirm(data.reason);
    form.reset();
  };

  const isSubmitDisabled = isSubmitting || isLoadingInquiry || (hasMinusStock && !agreeNegativeStock);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Batalkan Pesanan Pembelian
          </DialogTitle>
          <DialogDescription>
            Pesanan <span className="font-mono font-semibold text-foreground">{purchase.nomor_pembelian}</span> akan dibatalkan.
          </DialogDescription>
        </DialogHeader>

        {isLoadingInquiry ? (
          <div className="flex items-center justify-center py-6 gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Memeriksa inquiry posisi stok...
          </div>
        ) : hasReceivedItems ? (
          <div className="space-y-3">
            {/* Inquiry Rekonsiliasi Table */}
            <div className="border rounded-md overflow-hidden bg-card">
              <div className="bg-muted/50 px-3 py-2 border-b flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Inquiry Rekonsiliasi Posisi Stok
                </span>
                {hasMinusStock ? (
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                    Ada Potensi Stok Minus
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 text-green-700 dark:text-green-400 bg-green-500/10">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Stok Mencukupi
                  </Badge>
                )}
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="text-[11px] bg-muted/20">
                    <TableHead className="py-2">Produk</TableHead>
                    <TableHead className="text-right py-2">Stok Saat Ini</TableHead>
                    <TableHead className="text-right py-2">Akan Ditarik</TableHead>
                    <TableHead className="text-right py-2 font-semibold">Posisi Setelahnya</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inquiryItems.map((item) => (
                    <TableRow key={item.id} className={item.isMinus ? "bg-destructive/5" : ""}>
                      <TableCell className="py-2 text-xs font-medium">{item.nama_produk}</TableCell>
                      <TableCell className="py-2 text-xs text-right font-mono">
                        {item.stok_saat_ini} {item.nama_satuan}
                      </TableCell>
                      <TableCell className="py-2 text-xs text-right font-mono text-muted-foreground">
                        -{item.akan_diretur} {item.nama_satuan}
                      </TableCell>
                      <TableCell className="py-2 text-xs text-right font-mono">
                        <span
                          className={`font-semibold inline-flex items-center gap-1 ${
                            item.isMinus
                              ? "text-destructive font-bold"
                              : "text-green-600 dark:text-green-400"
                          }`}
                        >
                          {item.posisi_after} {item.nama_satuan}
                          {item.isMinus && (
                            <span className="text-[10px] bg-destructive/10 text-destructive px-1 py-0.2 rounded font-sans font-normal">
                              MINUS
                            </span>
                          )}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Warning & Global Agreement Checkbox for Minus Stock */}
            {hasMinusStock && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 space-y-2">
                <div className="flex items-start gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <div className="text-xs space-y-1">
                    <p className="font-semibold">Perhatian: Saldo Stok Akan Menjadi Minus</p>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      Beberapa barang telah mengalami pergerakan lain atau stok awal kurang dari jumlah yang ditarik. Pembatalan tetap akan memotong stok dan mencatat mutasi penyesuaian.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-1 border-t border-destructive/20">
                  <Checkbox
                    id="agree-negative"
                    checked={agreeNegativeStock}
                    onCheckedChange={(checked) => setAgreeNegativeStock(!!checked)}
                    disabled={isSubmitting}
                  />
                  <label
                    htmlFor="agree-negative"
                    className="text-xs font-medium leading-tight text-destructive cursor-pointer select-none"
                  >
                    Setuju tetap dibatalkan/diretur, posisi saldo persediaan akan minus.
                  </label>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground bg-muted/40 p-3 rounded border">
            Pesanan ini belum memiliki barang yang diterima. Pembatalan tidak akan memengaruhi saldo stok barang.
          </p>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Alasan Pembatalan (Opsional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Contoh: Kesalahan pesanan / Supplier membatalkan pengiriman / Rekonsiliasi nota."
                      className="text-xs min-h-[60px]"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
                Kembali
              </Button>
              <Button type="submit" variant="destructive" size="sm" disabled={isSubmitDisabled}>
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
