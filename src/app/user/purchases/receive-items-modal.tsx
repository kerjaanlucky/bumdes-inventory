
"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PurchaseItem } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { Loader2 } from "lucide-react";

const receiveItemSchema = z.object({
  id: z.any(),
  produk_id: z.number(),
  nama_produk: z.string(),
  jumlah: z.number(),
  jumlah_diterima: z.coerce.number().min(0, "Jumlah tidak boleh negatif"),
});

const receiveSchema = z.object({
  items: z.array(receiveItemSchema),
});

type ReceiveFormValues = z.infer<typeof receiveSchema>;

interface ReceiveItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: PurchaseItem[];
  onSubmit: (items: PurchaseItem[]) => Promise<void>;
}

export function ReceiveItemsModal({ isOpen, onClose, items, onSubmit }: ReceiveItemsModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<ReceiveFormValues>({
    resolver: zodResolver(receiveSchema),
    defaultValues: {
      items: items.map(item => ({
        id: item.id,
        produk_id: item.produk_id,
        nama_produk: item.nama_produk,
        jumlah: item.jumlah,
        jumlah_diterima: item.jumlah, // Default to receiving all
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
        return {
            ...originalItem,
            jumlah_diterima: receivedItem ? receivedItem.jumlah_diterima : originalItem.jumlah_diterima,
            tanggal_diterima: receivedItem && receivedItem.jumlah_diterima > 0 ? new Date().toISOString() : originalItem.tanggal_diterima,
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
            Masukkan jumlah barang yang diterima untuk setiap item.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)}>
            <ScrollArea className="h-[60vh] pr-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produk</TableHead>
                    <TableHead className="w-32">Dipesan</TableHead>
                    <TableHead className="w-48">Diterima</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.nama_produk}</TableCell>
                      <TableCell>{item.jumlah}</TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`items.${index}.jumlah_diterima`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input type="number" {...field} max={item.jumlah} />
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
