"use client";

import { useForm, useFieldArray, SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { usePurchaseStore } from "@/store/purchase-store";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { Loader2, Calendar as CalendarIcon, Trash2, PlusCircle } from "lucide-react";
import { Supplier, Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

const purchaseItemSchema = z.object({
  id: z.string(),
  produk_id: z.coerce.number().min(1, "Produk harus dipilih"),
  nama_produk: z.string(),
  nama_satuan: z.string(),
  jumlah: z.coerce.number().min(1, "Jumlah minimal 1"),
  harga_beli_satuan: z.coerce.number().min(0, "Harga tidak boleh negatif"),
  diskon: z.coerce.number().min(0, "Diskon tidak boleh negatif").optional().default(0),
  subtotal: z.coerce.number(),
  jumlah_diterima: z.number().default(0),
});

const purchaseSchema = z.object({
  supplier_id: z.coerce.number().min(1, "Pemasok wajib dipilih"),
  no_faktur_supplier: z.string().optional(),
  tanggal_pembelian: z.date({ required_error: "Tanggal pembelian wajib diisi" }),
  items: z.array(purchaseItemSchema).min(1, "Minimal harus ada 1 barang dalam pembelian"),
  total_harga: z.coerce.number(),
  diskon_invoice: z.coerce.number().optional().default(0),
  pajak: z.coerce.number().optional().default(0),
  ongkos_kirim: z.coerce.number().optional().default(0),
});

type PurchaseFormValues = z.infer<typeof purchaseSchema>;

export default function NewPurchasePage() {
  const router = useRouter();
  const { addPurchase, isSubmitting } = usePurchaseStore();
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchDropdownData = async () => {
      const supplierResponse = await fetch('/api/suppliers?all=true');
      const productResponse = await fetch('/api/products?all=true');
      setSuppliers(await supplierResponse.json());
      const productData = await productResponse.json();
      setProducts(productData.data);
    }
    fetchDropdownData();
  }, []);

  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      items: [],
      total_harga: 0,
      diskon_invoice: 0,
      pajak: 0,
      ongkos_kirim: 0
    },
  });
  
  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchItems = form.watch("items");
  const watchOngkosKirim = form.watch("ongkos_kirim");
  const watchDiskonInvoice = form.watch("diskon_invoice");
  const watchPajak = form.watch("pajak");

  useEffect(() => {
    const totalSubtotal = watchItems.reduce((sum, item) => item.subtotal || 0, 0);
    const totalAfterDiscount = totalSubtotal - watchDiskonInvoice;
    const totalAfterPpn = totalAfterDiscount + (totalAfterDiscount * (watchPajak / 100));
    const grandTotal = totalAfterPpn + watchOngkosKirim;
    form.setValue("total_harga", grandTotal);
  }, [watchItems, watchDiskonInvoice, watchPajak, watchOngkosKirim, form]);
  
  const handleProductChange = (index: number, productId: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      const currentItem = form.getValues(`items.${index}`);
      update(index, {
        ...currentItem,
        produk_id: product.id,
        nama_produk: product.nama_produk,
        nama_satuan: product.nama_satuan || 'N/A',
        harga_beli_satuan: product.harga_modal, // Use harga_modal as default harga_beli
        jumlah: 1,
        subtotal: product.harga_modal // Recalculate subtotal
      });
    }
  };
  
  useEffect(() => {
    watchItems.forEach((item, index) => {
        if(item.jumlah && item.harga_beli_satuan) {
            const subtotal = item.jumlah * item.harga_beli_satuan;
            if (form.getValues(`items.${index}.subtotal`) !== subtotal) {
                 form.setValue(`items.${index}.subtotal`, subtotal, { shouldValidate: true });
            }
        }
    })
  }, [watchItems, form]);


  const addNewItem = () => {
    append({
      id: `new-${fields.length}`,
      produk_id: 0,
      nama_produk: '',
      nama_satuan: '',
      jumlah: 1,
      harga_beli_satuan: 0,
      diskon: 0,
      subtotal: 0,
      jumlah_diterima: 0,
    });
  };

  const onSubmit: SubmitHandler<PurchaseFormValues> = async (data) => {
    const formattedData = {
        ...data,
        tanggal_pembelian: format(data.tanggal_pembelian, 'yyyy-MM-dd'),
    };
    await addPurchase(formattedData as any);
    router.push("/user/purchases");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex items-center">
            <h1 className="text-lg font-semibold md:text-2xl font-headline">Buat Pesanan Pembelian</h1>
             <div className="ml-auto flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Simpan sebagai Draft
                </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Informasi Pemasok & Faktur</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <FormField
                  control={form.control}
                  name="supplier_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pemasok</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={String(field.value)} disabled={isSubmitting}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih pemasok" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {suppliers.map(sup => (
                              <SelectItem key={sup.id} value={String(sup.id)}>{sup.nama_supplier}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                    control={form.control}
                    name="tanggal_pembelian"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Tanggal Pembelian</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                )}
                                >
                                {field.value ? (
                                    format(field.value, "PPP")
                                ) : (
                                    <span>Pilih tanggal</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                 />
                 <FormField
                  control={form.control}
                  name="no_faktur_supplier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>No Faktur Pemasok (Opsional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: INV/2024/07/XYZ" {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
          
           <Card>
            <CardHeader>
              <CardTitle>Item Pembelian</CardTitle>
               <CardDescription>Tambahkan produk yang akan dibeli.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[30%]">Produk</TableHead>
                            <TableHead>Jumlah</TableHead>
                            <TableHead>Harga Beli</TableHead>
                            <TableHead>Subtotal</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {fields.map((item, index) => (
                            <TableRow key={item.id}>
                                <TableCell>
                                    <FormField
                                        control={form.control}
                                        name={`items.${index}.produk_id`}
                                        render={({ field }) => (
                                            <Select onValueChange={(value) => handleProductChange(index, Number(value))} defaultValue={String(field.value)}>
                                                <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pilih produk" />
                                                </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                {products.map(p => (
                                                    <SelectItem key={p.id} value={String(p.id)}>{p.nama_produk}</SelectItem>
                                                ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </TableCell>
                                <TableCell>
                                     <FormField
                                        control={form.control}
                                        name={`items.${index}.jumlah`}
                                        render={({ field }) => <Input type="number" {...field} />}
                                    />
                                </TableCell>
                                 <TableCell>
                                     <FormField
                                        control={form.control}
                                        name={`items.${index}.harga_beli_satuan`}
                                        render={({ field }) => <Input type="number" {...field} />}
                                    />
                                </TableCell>
                                <TableCell>
                                     <Controller
                                        control={form.control}
                                        name={`items.${index}.subtotal`}
                                        render={({ field }) => (
                                            <span>Rp{Number(field.value || 0).toLocaleString('id-ID')}</span>
                                        )}
                                    />
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => remove(index)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <Button type="button" variant="outline" size="sm" className="mt-4" onClick={addNewItem}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Tambah Item
                </Button>
            </CardContent>
            <CardFooter className="flex justify-end">
                <div className="w-full max-w-sm space-y-4">
                    <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>Rp{watchItems.reduce((sum, item) => sum + (item.subtotal || 0), 0).toLocaleString('id-ID')}</span>
                    </div>
                     <Separator />
                     <div className="flex items-center justify-between">
                        <FormLabel>Diskon Invoice (Rp)</FormLabel>
                         <FormField
                            control={form.control}
                            name="diskon_invoice"
                            render={({ field }) => <Input type="number" {...field} className="w-32" />}
                        />
                    </div>
                     <div className="flex items-center justify-between">
                        <FormLabel>Pajak (%)</FormLabel>
                         <FormField
                            control={form.control}
                            name="pajak"
                            render={({ field }) => <Input type="number" {...field} className="w-32" />}
                        />
                    </div>
                     <div className="flex items-center justify-between">
                        <FormLabel>Ongkos Kirim (Rp)</FormLabel>
                        <FormField
                            control={form.control}
                            name="ongkos_kirim"
                            render={({ field }) => <Input type="number" {...field} className="w-32" />}
                        />
                    </div>
                     <Separator />
                     <div className="flex justify-between font-bold text-lg">
                        <span>Grand Total</span>
                        <span>Rp{(form.getValues('total_harga') || 0).toLocaleString('id-ID')}</span>
                    </div>
                </div>
            </CardFooter>
          </Card>
        </div>
      </form>
    </Form>
  );
}
