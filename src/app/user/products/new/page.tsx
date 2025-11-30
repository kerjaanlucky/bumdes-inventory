
"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProductStore } from "@/store/product-store";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Category, Unit } from "@/lib/types";

const productSchema = z.object({
  kode_produk: z.string().min(1, "Kode produk wajib diisi"),
  nama_produk: z.string().min(1, "Nama produk wajib diisi"),
  kategori_id: z.coerce.number().min(1, "Kategori wajib dipilih"),
  satuan_id: z.coerce.number().min(1, "Satuan wajib dipilih"),
  stok: z.coerce.number().min(0, "Stok tidak boleh negatif"),
  harga_modal: z.coerce.number().min(0, "Harga modal tidak boleh negatif"),
  harga_jual: z.coerce.number().min(0, "Harga jual tidak boleh negatif"),
  branch_id: z.string().optional(), // branch_id will be handled by the store
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function NewProductPage() {
  const router = useRouter();
  const { addProduct, isSubmitting } = useProductStore();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);

  useEffect(() => {
    const fetchDropdownData = async () => {
      // In a real app, you'd fetch this from your backend, filtered by branchId
      const catResponse = await fetch('/api/categories?all=true');
      const unitResponse = await fetch('/api/units?all=true');
      setCategories(await catResponse.json());
      setUnits(await unitResponse.json());
    }
    fetchDropdownData();
  }, []);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      kode_produk: "",
      nama_produk: "",
      stok: 0,
      harga_modal: 0,
      harga_jual: 0,
    },
  });

  const watchNamaProduk = form.watch("nama_produk");

  useEffect(() => {
    // Generate product code only once when user starts typing the name
    if (watchNamaProduk && !form.getValues("kode_produk")) {
      const randomCode = Math.floor(10000000 + Math.random() * 90000000).toString();
      form.setValue("kode_produk", randomCode, { shouldValidate: true });
    }
  }, [watchNamaProduk, form]);


  const onSubmit: SubmitHandler<ProductFormValues> = async (data) => {
    await addProduct(data);
    toast({
      title: "Produk Ditambahkan",
      description: "Produk baru telah berhasil ditambahkan.",
    });
    router.push("/user/products");
  };

  return (
    <div className="flex flex-col gap-4 py-4">
      <Card>
        <CardHeader>
          <CardTitle>Tambah Produk Baru</CardTitle>
          <CardDescription>Isi formulir untuk menambahkan produk baru.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="nama_produk"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Produk</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Laptop Pro" {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="kode_produk"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kode Produk (Otomatis)</FormLabel>
                      <FormControl>
                        <Input {...field} disabled />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="kategori_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategori</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={String(field.value)} disabled={isSubmitting}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih kategori" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map(cat => (
                              <SelectItem key={cat.id} value={String(cat.id)}>{cat.nama_kategori}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="satuan_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Satuan</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={String(field.value)} disabled={isSubmitting}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih satuan" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                           {units.map(unit => (
                              <SelectItem key={unit.id} value={String(unit.id)}>{unit.nama_satuan}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="stok"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stok Awal</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="harga_modal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Harga Modal</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="harga_jual"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Harga Jual</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Tambah Produk
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
