"use client";

import { useForm, useFieldArray, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useMemo } from "react";
import { Loader2, Calendar as CalendarIcon, Trash2, PlusCircle, Building, Phone } from "lucide-react";
import { Customer, Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import SearchableSelect from "@/components/ui/searchable-select";
import { useDebounce } from 'use-debounce';
import { useCustomerStore } from "@/store/customer-store";
import { useProductStore } from "@/store/product-store";
import { useSaleStore } from "@/store/sale-store";
import { CustomerSheet } from "./customer-sheet";

const saleItemSchema = z.object({
  id: z.string(),
  produk_id: z.string().min(1, "Produk harus dipilih"),
  nama_produk: z.string(),
  nama_satuan: z.string(),
  jumlah: z.coerce.number().min(1, "Jumlah minimal 1"),
  harga_jual_satuan: z.coerce.number().min(0, "Harga tidak boleh negatif"),
  diskon: z.coerce.number().min(0, "Diskon tidak boleh negatif").optional().default(0),
  subtotal: z.coerce.number(),
});

const saleSchema = z.object({
  customer_id: z.string().min(1, "Pelanggan wajib dipilih"),
  tanggal_penjualan: z.date({ required_error: "Tanggal penjualan wajib diisi" }),
  items: z.array(saleItemSchema).min(1, "Minimal harus ada 1 barang dalam penjualan"),
  total_harga: z.coerce.number(),
  diskon_invoice: z.coerce.number().optional().default(0),
  pajak: z.coerce.number().optional().default(0),
  ongkos_kirim: z.coerce.number().optional().default(0),
});

type SaleFormValues = z.infer<typeof saleSchema>;

export default function NewSalePage() {
  const router = useRouter();
  const { addSale, isSubmitting } = useSaleStore();
  const { toast } = useToast();
  
  const { customers, fetchCustomers: fetchCustomerStore, isFetching: isCustomersLoading, setSearchTerm: setCustomerSearchTerm, getCustomerById } = useCustomerStore();
  const { products, fetchProducts, isFetching: isProductsLoading, setSearchTerm: setProductSearchTerm } = useProductStore();
  
  const [productQuery, setProductQuery] = useState('');
  const [customerQuery, setCustomerQuery] = useState('');
  const [selectedProductToAdd, setSelectedProductToAdd] = useState<string>('');
  const [selectedCustomerDetails, setSelectedCustomerDetails] = useState<Customer | null>(null);
  const [isCustomerSheetOpen, setCustomerSheetOpen] = useState(false);
  
  const [debouncedCustomerSearch] = useDebounce(customerQuery, 300);
  const [debouncedProductSearch] = useDebounce(productQuery, 300);

  useEffect(() => {
    setCustomerSearchTerm(debouncedCustomerSearch);
    fetchCustomerStore({ all: true });
  }, [debouncedCustomerSearch, fetchCustomerStore, setCustomerSearchTerm]);

  useEffect(() => {
    setProductSearchTerm(debouncedProductSearch);
    fetchProducts();
  }, [debouncedProductSearch, fetchProducts, setProductSearchTerm]);

  const customerOptions = useMemo(() => 
    customers.map(c => ({ value: c.id, label: c.nama_customer })), 
    [customers]
  );
  
  const productOptions = useMemo(() => 
    products.map(p => ({ value: p.id, label: `${p.kode_produk} - ${p.nama_produk}` })), 
    [products]
  );

  const form = useForm<SaleFormValues>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      items: [],
      total_harga: 0,
      diskon_invoice: 0,
      pajak: 0,
      ongkos_kirim: 0,
      tanggal_penjualan: new Date(),
    },
  });

  const watchCustomerId = form.watch("customer_id");

  useEffect(() => {
    const fetchCustomerDetails = async () => {
      if (watchCustomerId) {
        const details = await getCustomerById(watchCustomerId);
        setSelectedCustomerDetails(details || null);
      } else {
        setSelectedCustomerDetails(null);
      }
    };
    fetchCustomerDetails();
  }, [watchCustomerId, getCustomerById]);
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });
  
  const watchAllFields = form.watch();
  useEffect(() => {
      const { items, diskon_invoice, pajak, ongkos_kirim } = watchAllFields;
      let newSubtotal = 0;
      let newTotalDiscount = 0;

      items?.forEach((item, index) => {
        const subtotal = (item?.jumlah || 0) * (item?.harga_jual_satuan || 0);
        newSubtotal += subtotal;
        if (form.getValues(`items.${index}.subtotal`) !== subtotal) {
          form.setValue(`items.${index}.subtotal`, subtotal);
        }
        const itemDiscount = subtotal * ((item?.diskon || 0) / 100);
        newTotalDiscount += itemDiscount;
      });
      
      const ongkir = Number(ongkos_kirim || 0);
      const invDiscount = Number(diskon_invoice || 0);
      const taxPercent = Number(pajak || 0);

      const newDpp = newSubtotal - newTotalDiscount - invDiscount;
      const newTaxAmount = newDpp * (taxPercent / 100);
      const newGrandTotal = newDpp + newTaxAmount + ongkir;

      if (form.getValues('total_harga') !== newGrandTotal) {
        form.setValue("total_harga", newGrandTotal);
      }
  }, [watchAllFields, form]);
  
  const currentFormValues = form.getValues();
  const items = currentFormValues.items || [];
  const subtotal = items.reduce((sum, item) => sum + (item?.subtotal || 0), 0);
  const totalDiscount = items.reduce((sum, item) => sum + ((item?.subtotal || 0) * ((item?.diskon || 0) / 100)), 0);
  const dpp = subtotal - totalDiscount - (currentFormValues.diskon_invoice || 0);
  const taxAmount = dpp * ((currentFormValues.pajak || 0) / 100);
  const grandTotal = dpp + taxAmount + (currentFormValues.ongkos_kirim || 0);


  const handleAddProduct = () => {
    if (!selectedProductToAdd) {
        toast({ variant: "destructive", title: "Produk belum dipilih", description: "Silakan cari dan pilih produk terlebih dahulu."});
        return;
    };
    const product = products.find(p => p.id === selectedProductToAdd);
    if (product) {
      if (product.stok <= 0) {
        toast({ variant: "destructive", title: "Stok Habis", description: `${product.nama_produk} tidak tersedia.`});
        return;
      }
      append({
        id: `new-${fields.length}`,
        produk_id: product.id,
        nama_produk: product.nama_produk,
        nama_satuan: product.nama_satuan || 'N/A',
        jumlah: 1,
        harga_jual_satuan: product.harga_jual,
        diskon: 0,
        subtotal: product.harga_jual,
      });
      setSelectedProductToAdd('');
      // Don't reset query to allow multiple adds from same search
    }
  };

  const onSubmit: SubmitHandler<SaleFormValues> = async (data) => {
    const formattedData = {
        ...data,
        tanggal_penjualan: format(data.tanggal_penjualan, 'yyyy-MM-dd'),
    };
    await addSale(formattedData as any);
    router.push("/user/sales");
  };

  const handleNewCustomerSuccess = (newCustomer: Customer) => {
    fetchCustomerStore({ all: true }); // re-fetch all customers
    form.setValue('customer_id', newCustomer.id);
    setCustomerSheetOpen(false);
  }

  return (
    <>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex items-center">
            <h1 className="text-lg font-semibold md:text-2xl font-headline">Buat Penjualan Baru</h1>
             <div className="ml-auto flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Simpan Penjualan
                </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Informasi Pelanggan & Tanggal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <FormField
                  control={form.control}
                  name="customer_id"
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel>Pelanggan</FormLabel>
                      <div className="flex items-start gap-2">
                        <div className="flex-grow">
                          <FormControl>
                            <SearchableSelect
                                options={customerOptions}
                                value={field.value || ''}
                                onChange={(val) => field.onChange(val)}
                                onSearchChange={setCustomerQuery}
                                currentSearchQuery={customerQuery}
                                placeholder="Cari pelanggan..."
                                isLoading={isCustomersLoading}
                                disabled={isSubmitting}
                            />
                          </FormControl>
                        </div>
                        <Button type="button" variant="outline" size="icon" onClick={() => setCustomerSheetOpen(true)} disabled={isSubmitting}>
                          <PlusCircle className="h-4 w-4" />
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                    control={form.control}
                    name="tanggal_penjualan"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Tanggal Penjualan</FormLabel>
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
                {selectedCustomerDetails && (
                    <div className="md:col-span-3 -mt-4 p-3 bg-muted/50 rounded-lg border">
                        <p className="text-sm font-medium text-muted-foreground">Detail Pelanggan</p>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Phone className="h-4 w-4" />
                                <span>{selectedCustomerDetails.telepon || 'No phone'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Building className="h-4 w-4" />
                                <span>{selectedCustomerDetails.alamat || 'No address'}</span>
                            </div>
                        </div>
                    </div>
                )}
              </div>
            </CardContent>
          </Card>
          
           <Card className="bg-card/50">
            <CardHeader>
              <CardTitle>Item Penjualan</CardTitle>
               <CardDescription>Tambahkan produk yang akan dijual.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-visible">
                <div className="flex gap-2 mb-4">
                    <div className="flex-grow">
                        <SearchableSelect
                            options={productOptions}
                            value={selectedProductToAdd}
                            onChange={setSelectedProductToAdd}
                            onSearchChange={setProductQuery}
                            currentSearchQuery={productQuery}
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
                                <TableHead>Harga Jual</TableHead>
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
                                            name={`items.${index}.harga_jual_satuan`}
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
                                        Rp{(form.getValues(`items.${index}.subtotal`) || 0).toLocaleString('id-ID')}
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
                 {form.formState.errors.items && (
                    <p className="text-sm font-medium text-destructive mt-4">{form.formState.errors.items.root?.message || form.formState.errors.items.message}</p>
                 )}
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
                        <span>Pajak ({currentFormValues.pajak || 0}%)</span>
                        <span>+ Rp{taxAmount.toLocaleString('id-ID')}</span>
                    </div>
                     <div className="flex justify-between text-sm">
                        <span>Ongkos Kirim</span>
                         <span>+ Rp{(currentFormValues.ongkos_kirim || 0).toLocaleString('id-ID')}</span>
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
    <CustomerSheet
        open={isCustomerSheetOpen}
        onOpenChange={setCustomerSheetOpen}
        onSuccess={handleNewCustomerSuccess}
    />
    </>
  );
}
