
"use client";

import { useForm, useFieldArray, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useMemo, useCallback } from "react";
import { Loader2, Calendar as CalendarIcon, Trash2, PlusCircle, Building, Phone, AlertCircle } from "lucide-react";
import { Customer, Product, Branch, SaleItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import SearchableSelect from "@/components/ui/searchable-select";
import { useDebounce } from 'use-debounce';
import { useCustomerStore } from "@/store/customer-store";
import { useProductStore } from "@/store/product-store";
import { useSaleStore } from "@/store/sale-store";
import { CustomerSheet } from "../../new/customer-sheet";
import { useAuthStore } from "@/store/auth-store";
import { useBranchStore } from "@/store/branch-store";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


const saleItemSchema = z.object({
  id: z.string(),
  produk_id: z.string().min(1, "Produk harus dipilih"),
  nama_produk: z.string(),
  nama_satuan: z.string(),
  stok_tersedia: z.number(),
  jumlah: z.coerce.number().min(1, "Jumlah minimal 1"),
  harga_jual_satuan: z.coerce.number().min(0, "Harga tidak boleh negatif"),
  diskon: z.coerce.number().min(0, "Diskon tidak boleh negatif").optional().default(0),
  subtotal: z.coerce.number(),
});

const saleSchema = z.object({
  id: z.string(),
  customer_id: z.string().min(1, "Pelanggan wajib dipilih"),
  tanggal_penjualan: z.date({ required_error: "Tanggal penjualan wajib diisi" }),
  items: z.array(saleItemSchema).min(1, "Minimal harus ada 1 barang dalam penjualan"),
  total_harga: z.coerce.number(),
  diskon_invoice: z.coerce.number().optional().default(0),
  pajak: z.coerce.number().optional().default(0),
  taxType: z.enum(["inclusive", "exclusive"]).optional(),
  ongkos_kirim: z.coerce.number().optional().default(0),
  biaya_lain: z.coerce.number().optional().default(0),
});

type SaleFormValues = z.infer<typeof saleSchema>;

export default function EditSalePage() {
  const router = useRouter();
  const params = useParams();
  const saleId = params.id as string;
  const { getSaleById, editSale, isSubmitting, isFetching } = useSaleStore();
  const { toast } = useToast();
  
  const { userProfile } = useAuthStore();
  const { branches, getBranchById, fetchBranches } = useBranchStore();
  const { customers, fetchCustomers: fetchCustomerStore, isFetching: isCustomersLoading, setSearchTerm: setCustomerSearchTerm, getCustomerById } = useCustomerStore();
  const { products, fetchProducts, isFetching: isProductsLoading, setSearchTerm: setProductSearchTerm } = useProductStore();
  
  const [productQuery, setProductQuery] = useState('');
  const [customerQuery, setCustomerQuery] = useState('');
  const [selectedProductToAdd, setSelectedProductToAdd] = useState<string>('');
  const [selectedCustomerDetails, setSelectedCustomerDetails] = useState<Customer | null>(null);
  const [isCustomerSheetOpen, setCustomerSheetOpen] = useState(false);
  const [branchDetails, setBranchDetails] = useState<Branch | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);


  const [debouncedCustomerSearch] = useDebounce(customerQuery, 300);
  const [debouncedProductSearch] = useDebounce(productQuery, 300);

  const form = useForm<SaleFormValues>({
    resolver: zodResolver(saleSchema),
  });

  useEffect(() => {
    fetchBranches();
    fetchCustomerStore({ all: true });
    fetchProducts();
  }, [fetchBranches, fetchCustomerStore, fetchProducts]);

  useEffect(() => {
    const fetchSaleData = async () => {
      if (!saleId) return;
      const saleData = await getSaleById(saleId);
      if (saleData) {
        if (saleData.status !== 'DRAFT') {
            toast({
                variant: "destructive",
                title: "Tidak Dapat Mengubah",
                description: "Hanya penjualan dengan status DRAFT yang dapat diubah.",
            });
            router.push(`/user/sales/${saleId}`);
            return;
        }
        form.reset({
            ...saleData,
            tanggal_penjualan: new Date(saleData.tanggal_penjualan),
        });
        setIsDataLoaded(true);
      } else {
        router.push('/user/sales');
      }
    };
    fetchSaleData();
  }, [saleId, getSaleById, form, router, toast]);

  useEffect(() => {
    if (userProfile?.branchId && branches.length > 0) {
      const details = getBranchById(userProfile.branchId);
      if (details) {
        setBranchDetails(details);
      }
    }
  }, [userProfile, branches, getBranchById]);

  useEffect(() => {
    setCustomerSearchTerm(debouncedCustomerSearch);
  }, [debouncedCustomerSearch, setCustomerSearchTerm]);

  useEffect(() => {
    setProductSearchTerm(debouncedProductSearch);
  }, [debouncedProductSearch, setProductSearchTerm]);

  const customerOptions = useMemo(() => 
    customers.map(c => ({ value: c.id, label: c.nama_customer })), 
    [customers]
  );
  
  const productOptions = useMemo(() => 
    products.map(p => ({ value: p.id, label: `${p.kode_produk} - ${p.nama_produk}` })), 
    [products]
  );

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
      const { items, diskon_invoice, pajak, taxType, ongkos_kirim, biaya_lain } = watchAllFields;
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
      const biayaLain = Number(biaya_lain || 0);
      const invDiscount = Number(diskon_invoice || 0);
      const taxPercent = Number(pajak || 0);
      
      let dpp = newSubtotal - newTotalDiscount - invDiscount;
      let newTaxAmount = 0;
      
      if (taxType === 'inclusive') {
        const totalBeforeCosts = dpp;
        dpp = totalBeforeCosts / (1 + (taxPercent / 100));
        newTaxAmount = totalBeforeCosts - dpp;
      } else { // exclusive
        newTaxAmount = dpp * (taxPercent / 100);
      }
      
      const newGrandTotal = dpp + newTaxAmount + ongkir + biayaLain;


      if (form.getValues('total_harga') !== newGrandTotal) {
        form.setValue("total_harga", newGrandTotal);
      }
  }, [watchAllFields, form]);
  
  const currentFormValues = form.getValues();
  const items = currentFormValues.items || [];
  const subtotal = items.reduce((sum, item) => sum + (item?.subtotal || 0), 0);
  const totalDiscount = items.reduce((sum, item) => sum + ((item?.subtotal || 0) * ((item?.diskon || 0) / 100)), 0);
  const invDiscount = currentFormValues.diskon_invoice || 0;
  
  const taxType = currentFormValues.taxType || 'exclusive';
  const taxPercent = currentFormValues.pajak || 0;
  
  let dpp = subtotal - totalDiscount - invDiscount;
  let taxAmount = 0;

  if (taxType === 'inclusive') {
    taxAmount = dpp - (dpp / (1 + (taxPercent / 100)));
    dpp = dpp - taxAmount;
  } else {
    taxAmount = dpp * (taxPercent / 100);
  }

  const grandTotal = dpp + taxAmount + (currentFormValues.ongkos_kirim || 0) + (currentFormValues.biaya_lain || 0);



  const handleAddProduct = () => {
    if (!selectedProductToAdd) {
        toast({ variant: "destructive", title: "Produk belum dipilih", description: "Silakan cari dan pilih produk terlebih dahulu."});
        return;
    };
    const product = products.find(p => p.id === selectedProductToAdd);
    if (product) {
      append({
        id: `new-${fields.length}`,
        produk_id: product.id,
        nama_produk: product.nama_produk,
        nama_satuan: product.nama_satuan || 'N/A',
        stok_tersedia: product.stok,
        jumlah: 1,
        harga_jual_satuan: product.harga_jual,
        diskon: 0,
        subtotal: product.harga_jual,
      });
      // Do not reset product query to allow multiple adds from same search
      setSelectedProductToAdd('');
    }
  };

  const onSubmit: SubmitHandler<SaleFormValues> = async (data) => {
    const saleDataFromStore = await getSaleById(saleId);
    if (!saleDataFromStore) return;

    const formattedData = {
        ...saleDataFromStore, // Start with existing data
        ...data, // Overlay form data
        tanggal_penjualan: format(data.tanggal_penjualan, 'yyyy-MM-dd'),
    };
    await editSale(formattedData as Sale);
    router.push(`/user/sales/${saleId}`);
  };

  const handleNewCustomerSuccess = (newCustomer: Customer) => {
    fetchCustomerStore({ all: true }); // re-fetch all customers
    form.setValue('customer_id', newCustomer.id);
    setCustomerSheetOpen(false);
  }

  if (isFetching || !isDataLoaded) {
    return <div>Memuat data penjualan...</div>;
  }

  return (
    <>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex items-center">
            <h1 className="text-lg font-semibold md:text-2xl font-headline">Ubah Penjualan</h1>
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
                            {fields.map((item, index) => {
                                const currentJumlah = form.watch(`items.${index}.jumlah`);
                                const showStockWarning = currentJumlah > item.stok_tersedia;
                                return (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.nama_produk} <br/> <span className="text-xs text-muted-foreground">Stok: {item.stok_tersedia}</span></TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.jumlah`}
                                                render={({ field }) => <Input type="number" {...field} className="w-24" />}
                                            />
                                            <span className="text-sm text-muted-foreground">{item.nama_satuan}</span>
                                             {showStockWarning && (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger>
                                                             <AlertCircle className="h-4 w-4 text-destructive" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Jumlah melebihi stok yang tersedia!</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
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
                                )
                            })}
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
                     <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="taxType"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Tipe Pajak</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih tipe pajak" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    <SelectItem value="exclusive">Tidak Termasuk</SelectItem>
                                    <SelectItem value="inclusive">Termasuk</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="pajak"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Pajak (%)</FormLabel>
                                    <Input type="number" {...field} />
                                </FormItem>
                            )}
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
                     <div className="flex items-center justify-between">
                        <FormLabel>Biaya Lain-lain (Rp)</FormLabel>
                        <FormField
                            control={form.control}
                            name="biaya_lain"
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
                    <div className="flex justify-between text-sm">
                        <span>Diskon Invoice</span>
                        <span className="text-red-500">- Rp{invDiscount.toLocaleString('id-ID')}</span>
                    </div>
                    {taxType === 'inclusive' && (
                        <>
                            <Separator />
                            <div className="flex justify-between font-medium">
                                <span>DPP (Dasar Pengenaan Pajak)</span>
                                <span>Rp{dpp.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Pajak Termasuk ({taxPercent}%)</span>
                                <span>Rp{taxAmount.toLocaleString('id-ID')}</span>
                            </div>
                        </>
                    )}
                    {taxType === 'exclusive' && taxAmount > 0 && (
                        <div className="flex justify-between text-sm">
                            <span>Pajak ({taxPercent}%)</span>
                            <span>+ Rp{taxAmount.toLocaleString('id-ID')}</span>
                        </div>
                    )}
                     <div className="flex justify-between text-sm">
                        <span>Ongkos Kirim</span>
                         <span>+ Rp{(currentFormValues.ongkos_kirim || 0).toLocaleString('id-ID')}</span>
                    </div>
                     <div className="flex justify-between text-sm">
                        <span>Biaya Lain-lain</span>
                         <span>+ Rp{(currentFormValues.biaya_lain || 0).toLocaleString('id-ID')}</span>
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
