"use client";

import { useForm, useFieldArray, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { Loader2, Calendar as CalendarIcon, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useProductStore } from "@/store/product-store";
import { useStockOpnameStore } from "@/store/stock-opname-store";

const stockOpnameItemSchema = z.object({
  produk_id: z.string(),
  nama_produk: z.string(),
  nama_satuan: z.string(),
  stok_sistem: z.number(),
  stok_fisik: z.coerce.number().min(0, "Stok tidak boleh negatif"),
  selisih: z.number(),
  keterangan: z.string().optional(),
});

const stockOpnameSchema = z.object({
  tanggal: z.date({ required_error: "Tanggal wajib diisi" }),
  catatan: z.string().optional(),
  items: z.array(stockOpnameItemSchema),
});

type StockOpnameFormValues = z.infer<typeof stockOpnameSchema>;

export default function NewStockOpnamePage() {
  const router = useRouter();
  const { addStockOpname, isSubmitting } = useStockOpnameStore();
  const { products, fetchProducts, isFetching: isProductsFetching } = useProductStore();
  const { toast } = useToast();

  const form = useForm<StockOpnameFormValues>({
    resolver: zodResolver(stockOpnameSchema),
    defaultValues: {
      tanggal: new Date(),
      catatan: "",
      items: [],
    },
  });

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (products.length > 0 && form.getValues('items').length === 0) {
      const opnameItems = products.map(p => ({
        produk_id: p.id,
        nama_produk: p.nama_produk,
        nama_satuan: p.nama_satuan || 'N/A',
        stok_sistem: p.stok,
        stok_fisik: p.stok, // Default physical to system stock
        selisih: 0,
        keterangan: "",
      }));
      form.setValue('items', opnameItems);
    }
  }, [products, form]);

  const { fields } = useFieldArray({
    control: form.control,
    name: "items",
  });
  
  const watchItems = form.watch("items");

  useEffect(() => {
    watchItems.forEach((item, index) => {
      const selisih = (item.stok_fisik || 0) - item.stok_sistem;
      if (form.getValues(`items.${index}.selisih`) !== selisih) {
        form.setValue(`items.${index}.selisih`, selisih);
      }
    });
  }, [watchItems, form]);


  const onSubmit: SubmitHandler<StockOpnameFormValues> = async (data) => {
    await addStockOpname(data);
    toast({ title: "Stock Opname Disimpan", description: "Draft stock opname telah berhasil disimpan." });
    router.push("/user/inventory/stock-opname");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex items-center">
            <h1 className="text-lg font-semibold md:text-2xl font-headline">Buat Stock Opname Baru</h1>
             <div className="ml-auto flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting || isProductsFetching}>
                  {(isSubmitting || isProductsFetching) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Simpan sebagai Draft
                </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Informasi Umum</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="tanggal"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Tanggal Stock Opname</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
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
                                disabled={(date) => date > new Date()}
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
                  name="catatan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catatan (Opsional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Contoh: Stock opname bulanan" {...field} disabled={isSubmitting} />
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
              <CardTitle>Daftar Item</CardTitle>
               <CardDescription>Isi kolom 'Stok Fisik' dengan hasil hitungan Anda. Selisih akan terhitung otomatis.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[30%]">Produk</TableHead>
                            <TableHead className="text-center">Stok Sistem</TableHead>
                            <TableHead className="w-40 text-center">Stok Fisik</TableHead>
                            <TableHead className="text-center">Selisih</TableHead>
                            <TableHead className="w-[25%]">Keterangan</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isProductsFetching ? (
                            <TableRow><TableCell colSpan={5} className="h-48 text-center">Memuat produk...</TableCell></TableRow>
                        ) : fields.map((item, index) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.nama_produk}</TableCell>
                                <TableCell className="text-center">{item.stok_sistem} {item.nama_satuan}</TableCell>
                                <TableCell>
                                    <FormField
                                        control={form.control}
                                        name={`items.${index}.stok_fisik`}
                                        render={({ field }) => <Input type="number" {...field} className="text-center" />}
                                    />
                                </TableCell>
                                <TableCell className={cn("text-center font-medium", form.getValues(`items.${index}.selisih`) > 0 ? 'text-green-600' : form.getValues(`items.${index}.selisih`) < 0 ? 'text-red-600' : '')}>
                                    {form.getValues(`items.${index}.selisih`)}
                                </TableCell>
                                <TableCell>
                                     <FormField
                                        control={form.control}
                                        name={`items.${index}.keterangan`}
                                        render={({ field }) => <Input placeholder="Contoh: Barang rusak" {...field} />}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
          </Card>
        </div>
      </form>
    </Form>
  );
}
