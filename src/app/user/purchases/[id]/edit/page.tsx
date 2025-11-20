
"use client";

import { useForm, useFieldArray, SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { usePurchaseStore } from "@/store/purchase-store";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useMemo } from "react";
import { Loader2, Calendar as CalendarIcon, Trash2, PlusCircle } from "lucide-react";
import { Supplier, Product, PurchaseItem as PurchaseItemType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import SearchableSelect, { SearchableSelectOption } from "@/components/ui/searchable-select";
import { useDebounce } from 'use-debounce';

const purchaseItemSchema = z.object({
  id: z.any(),
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
  id: z.number(),
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

export default function EditPurchasePage() {
  const router = useRouter();
  const params = useParams();
  const purchaseId = Number(params.id);
  const { editPurchase, getPurchaseById, isSubmitting, isFetching } = usePurchaseStore();
  const { toast } = useToast();
  
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [isSuppliersLoading, setIsSuppliersLoading] = useState(false);
  const [isProductsLoading, setIsProductsLoading] = useState(false);
  const [selectedProductToAdd, setSelectedProductToAdd] = useState<string>('');
  
  const [debouncedSupplierSearch] = useDebounce(supplierSearch, 300);
  const [debouncedProductSearch] = useDebounce(productSearch, 300);

  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
  });

  useEffect(() => {
    const fetchPurchaseData = async () => {
        if (!purchaseId) return;
        const purchaseData = await getPurchaseById(purchaseId);
        if (purchaseData) {
             if (purchaseData.status !== 'DRAFT') {
                toast({
                    variant: "destructive",
                    title: "Tidak Dapat Mengubah",
                    description: "Hanya pesanan dengan status DRAFT yang dapat diubah.",
                });
                router.push(`/user/purchases/${purchaseId}`);
                return;
            }
            form.reset({
                ...purchaseData,
                tanggal_pembelian: new Date(purchaseData.tanggal_pembelian),
            });
        } else {
            router.push('/user/purchases');
        }
    };
    fetchPurchaseData();
  }, [purchaseId, getPurchaseById, form, router, toast]);

  useEffect(() => {
    const fetchSuppliers = async () => {
        setIsSuppliersLoading(true);
        const response = await fetch(`/api/suppliers?all=true&search=${debouncedSupplierSearch}`);
        setSuppliers(await response.json());
        setIsSuppliersLoading(false);
    }
    fetchSuppliers();
  }, [debouncedSupplierSearch]);

  useEffect(() => {
    const fetchProducts = async () => {
        setIsProductsLoading(true);
        const response = await fetch(`/api/products?all=true&search=${debouncedProductSearch}`);
        const productData = await response.json();
        setProducts(productData.data);
        setIsProductsLoading(false);
    }
    fetchProducts();
  }, [debouncedProductSearch]);

  const supplierOptions = useMemo(() => 
    suppliers.map(s => ({ value: String(s.id), label: s.nama_supplier })), 
    [suppliers]
  );
  
  const productOptions = useMemo(() => 
    products.map(p => ({ value: String(p.id), label: `${p.kode_produk} - ${p.nama_produk}` })), 
    [products]
  );

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchItems = form.watch("items");
  const watchOngkosKirim = form.watch("ongkos_kirim");
  const watchDiskonInvoice = form.watch("diskon_invoice");
  const watchPajak = form.watch("pajak");

  const { subtotal, totalDiscount, grandTotal } = useMemo(() => {
    const currentItems = form.getValues('items') || [];
    const subtotal = currentItems.reduce((sum, item) => {
        const itemSubtotal = (item.jumlah || 0) * (item.harga_beli_satuan || 0);
        return sum + itemSubtotal;
    }, 0);

    const totalDiscount = currentItems.reduce((sum, item) => {
        const itemSubtotal = (item.jumlah || 0) * (item.harga_beli_satuan || 0);
        const itemDiscount = itemSubtotal * ((item.diskon || 0) / 100);
        return sum + itemDiscount;
    }, 0);

    const ongkir = form.getValues('ongkos_kirim') || 0;
    const diskonInvoice = form.getValues('diskon_invoice') || 0;
    const pajak = form.getValues('pajak') || 0;

    const dpp = subtotal - totalDiscount - diskonInvoice;
    const taxAmount = dpp * (pajak / 100);
    const grandTotal = dpp + taxAmount + ongkir;

    return { subtotal, totalDiscount, grandTotal };
  }, [watchItems, watchOngkosKirim, watchDiskonInvoice, watchPajak, form]);


  useEffect(() => {
    form.setValue("total_harga", grandTotal, { shouldValidate: true });
  }, [grandTotal, form]);
  
  useEffect(() => {
    watchItems.forEach((item, index) => {
        const subtotal = (item.jumlah || 0) * (item.harga_beli_satuan || 0);
        if (form.getValues(`items.${index}.subtotal`) !== subtotal) {
            form.setValue(`items.${index}.subtotal`, subtotal, { shouldValidate: true });
        }
    });
  }, [watchItems, form]);

  const handleAddProduct = () => {
    if (!selectedProductToAdd) {
        toast({ variant: "destructive", title: "Produk belum dipilih", description: "Silakan cari dan pilih produk terlebih dahulu."});
        return;
    };
    const product = products.find(p => p.id === Number(selectedProductToAdd));
    if (product) {
      append({
        id: `new-${fields.length}`,
        produk_id: product.id,
        nama_produk: product.nama_produk,
        nama_satuan: product.nama_satuan || 'N/A',
        jumlah: 1,
        harga_beli_satuan: product.harga_modal,
        diskon: 0,
        subtotal: product.harga_modal,
        jumlah_diterima: 0,
      });
      setSelectedProductToAdd('');
      setProductSearch('');
    }
  };


  const onSubmit: SubmitHandler<PurchaseFormValues> = async (data) => {
    const formattedData = {
        ...data,
        tanggal_pembelian: format(data.tanggal_pembelian, 'yyyy-MM-dd'),
    };
    await editPurchase(formattedData as any);
    router.push(`/user/purchases/${purchaseId}`);
  };

  if (isFetching || !form.formState.isDirty) {
    return <div>Memuat data pembelian...</div>;
  }

  const dpp = subtotal - totalDiscount - (watchDiskonInvoice || 0);
  const taxAmount = dpp * ((watchPajak || 0) / 100);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex items-center">
            <h1 className="text-lg font-semibold md:text-2xl font-headline">Ubah Pesanan Pembelian</h1>
             <div className="ml-auto flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Simpan Perubahan
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
                      <FormControl>
                        <SearchableSelect
                            options={supplierOptions}
                            value={String(field.value || '')}
                            onChange={(val) => field.onChange(Number(val))}
                            onSearchChange={setSupplierSearch}
                            placeholder="Cari pemasok..."
                            isLoading={isSuppliersLoading}
                            disabled={isSubmitting}
                        />
                      </FormControl>
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
                                disabled={isSubmitting}
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
                        <Input placeholder="Contoh: INV/2024/07/XYZ" {...field} value={field.value || ''} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
          
           <Card className="bg-card/50">
            <CardHeader>
              <CardTitle>Item Pembelian</CardTitle>
               <CardDescription>Tambahkan produk yang akan dibeli.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-visible">
                <div className="flex gap-2 mb-4">
                    <div className="flex-grow">
                        <SearchableSelect
                            options={productOptions}
                            value={selectedProductToAdd}
                            onChange={setSelectedProductToAdd}
                            onSearchChange={setProductSearch}
                            placeholder="Cari produk untuk ditambahkan..."
                            isLoading={isProductsLoading}
                        />
                    </div>
                    <Button type="button" variant="outline" onClick={handleAddProduct}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Tambah
                    </Button>
                </div>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[30%]">Produk</TableHead>
                                <TableHead>Jumlah</TableHead>
                                <TableHead>Harga Beli</TableHead>
                                <TableHead>Diskon (%)</TableHead>
                                <TableHead className="text-right">Subtotal</TableHead>
                                <TableHead className="text-right w-[50px]">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {fields.map((item, index) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.nama_produk}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.jumlah`}
                                                render={({ field }) => <Input type="number" {...field} className="w-24" />}
                                            />
                                            <span className="text-sm text-muted-foreground">{item.nama_satuan}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.harga_beli_satuan`}
                                            render={({ field }) => <Input type="number" {...field} />}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.diskon`}
                                            render={({ field }) => <Input type="number" {...field} className="w-20" />}
                                        />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        Rp{((form.getValues(`items.${index}.jumlah`) || 0) * (form.getValues(`items.${index}.harga_beli_satuan`) || 0)).toLocaleString('id-ID')}
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
                 </div>
            </CardContent>
          </Card>
          
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <Card>
                <CardHeader><CardTitle>Biaya Tambahan & Pajak</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex items-center justify-between">
                        <FormLabel>Diskon Invoice (Rp)</FormLabel>
                         <FormField
                            control={form.control}
                            name="diskon_invoice"
                            render={({ field }) => <Input type="number" {...field} className="w-48" />}
                        />
                    </div>
                     <div className="flex items-center justify-between">
                        <FormLabel>Pajak (%)</FormLabel>
                         <FormField
                            control={form.control}
                            name="pajak"
                            render={({ field }) => <Input type="number" {...field} className="w-48" />}
                        />
                    </div>
                     <div className="flex items-center justify-between">
                        <FormLabel>Ongkos Kirim (Rp)</FormLabel>
                        <FormField
                            control={form.control}
                            name="ongkos_kirim"
                            render={({ field }) => <Input type="number" {...field} className="w-48" />}
                        />
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Rincian Total</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                     <div className="flex justify-between text-sm">
                        <span>Subtotal</span>
                        <span>Rp{subtotal.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span>Total Diskon</span>
                        <span className="text-red-500">- Rp{totalDiscount.toLocaleString('id-ID')}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-medium">
                        <span>DPP (Total Setelah Diskon)</span>
                        <span>Rp{dpp.toLocaleString('id-ID')}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-sm">
                        <span>Pajak ({watchPajak || 0}%)</span>
                        <span>+ Rp{taxAmount.toLocaleString('id-ID')}</span>
                    </div>
                     <div className="flex justify-between text-sm">
                        <span>Ongkos Kirim</span>
                         <span>+ Rp{(watchOngkosKirim || 0).toLocaleString('id-ID')}</span>
                    </div>
                    <Separator />
                     <div className="flex justify-between font-bold text-lg text-primary">
                        <span>Grand Total</span>
                        <span>Rp{grandTotal.toLocaleString('id-ID')}</span>
                    </div>
                </CardContent>
            </Card>
           </div>
        </div>
      </form>
    </Form>
  );
}

    