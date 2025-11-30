
"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PurchaseItem } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { Loader2 } from "lucide-react";

const receiveItemSchema = z.object({
  id: z.any(),
  produk_id: z.string(),
  nama_produk: z.string(),
  jumlah: z.number(),
  jumlah_diterima: z.number(), // This is the total received amount INCLUDING the new amount
  jumlah_diterima_sebelumnya: z.number(),
  jumlah_diterima_sekarang: z.coerce.number().min(0, "Jumlah tidak boleh negatif"),
});

const receiveSchema = z.object({
  items: z.array(receiveItemSchema).refine(
    items => items.some(item => item.jumlah_diterima_sekarang > 0),
    { message: "Minimal harus ada 1 barang yang diterima." }
  ),
}).refine(items => items.items.every(item => item.jumlah_diterima_sekarang <= (item.jumlah - item.jumlah_diterima_sebelumnya)), {
  message: "Jumlah diterima tidak boleh melebihi sisa pesanan.",
  path: ["items"]
});


type ReceiveFormValues = z.infer<typeof receiveSchema>;

interface ReceiveItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: PurchaseItem[];
  onSubmit: (items: PurchaseItem[]) => Promise<void>;
  purchaseNumber: string;
}

export function ReceiveItemsModal({ isOpen, onClose, items, onSubmit, purchaseNumber }: ReceiveItemsModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<ReceiveFormValues>({
    resolver: zodResolver(receiveSchema),
    defaultValues: {
      items: items.map(item => ({
        id: item.id,
        produk_id: item.produk_id,
        nama_produk: item.nama_produk,
        jumlah: item.jumlah,
        jumlah_diterima_sebelumnya: item.jumlah_diterima || 0,
        // Default to the remaining amount
        jumlah_diterima_sekarang: item.jumlah - (item.jumlah_diterima || 0), 
        jumlah_diterima: item.jumlah_diterima || 0
      })),
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "items",
  });
  
  const handleFormSubmit = async (data: ReceiveFormValues) => {
    setIsSubmitting(true);
    const updatedItems = items.map(originalItem => {
        const receivedItem = data.items.find(i => i.id === originalItem.id);
        const jumlahDiterimaBaru = (originalItem.jumlah_diterima || 0) + (receivedItem ? receivedItem.jumlah_diterima_sekarang : 0);
        return {
            ...originalItem,
            jumlah_diterima: jumlahDiterimaBaru,
            tanggal_diterima: receivedItem && receivedItem.jumlah_diterima_sekarang > 0 ? new Date().toISOString() : originalItem.tanggal_diterima,
        };
    });
    await onSubmit(updatedItems);
    setIsSubmitting(false);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Proses Penerimaan Barang</DialogTitle>
          <DialogDescription>
            Masukkan jumlah barang yang diterima untuk pesanan <span className="font-mono">{purchaseNumber}</span>.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)}>
            <ScrollArea className="h-[60vh] pr-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produk</TableHead>
                    <TableHead className="w-28">Dipesan</TableHead>
                    <TableHead className="w-28">Sudah Diterima</TableHead>
                    <TableHead className="w-48">Diterima Sekarang</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.nama_produk}</TableCell>
                      <TableCell>{item.jumlah}</TableCell>
                      <TableCell>{item.jumlah_diterima_sebelumnya}</TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`items.${index}.jumlah_diterima_sekarang`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input type="number" {...field} max={item.jumlah - item.jumlah_diterima_sebelumnya} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
             {form.formState.errors.items?.root && (
              <p className="text-sm font-medium text-destructive mt-2">{form.formState.errors.items.root.message}</p>
            )}
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Konfirmasi Penerimaan
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
