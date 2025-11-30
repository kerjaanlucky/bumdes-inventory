
"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProductStore } from "@/store/product-store";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useCallback } from "react";
import { Loader2, PlusCircle } from "lucide-react";
import { Category, Unit, Product } from "@/lib/types";
import { MasterDataSheet } from "../new/master-data-sheet";
import { useCategoryStore } from "@/store/category-store";
import { useUnitStore } from "@/store/unit-store";

const productSchema = z.object({
  id: z.string(),
  kode_produk: z.string().min(1, "Kode produk wajib diisi"),
  nama_produk: z.string().min(1, "Nama produk wajib diisi"),
  kategori_id: z.coerce.number().min(1, "Kategori wajib dipilih"),
  satuan_id: z.coerce.number().min(1, "Satuan wajib dipilih"),
  stok: z.coerce.number().min(0, "Stok tidak boleh negatif"),
  harga_modal: z.coerce.number().min(0, "Harga modal tidak boleh negatif"),
  harga_jual: z.coerce.number().min(0, "Harga jual tidak boleh negatif"),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const { editProduct, getProductById, isSubmitting, isFetching } = useProductStore();
  const { toast } = useToast();
  
  const { categories, fetchCategories: fetchCategoryStore } = useCategoryStore();
  const { units, fetchUnits: fetchUnitStore } = useUnitStore();
  
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetType, setSheetType] = useState<'category' | 'unit'>('category');

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
  });
  
  const fetchDropdownData = useCallback(async () => {
    await fetchCategoryStore();
    await fetchUnitStore();
  }, [fetchCategoryStore, fetchUnitStore]);

  useEffect(() => {
    fetchDropdownData();
    const fetchProduct = async () => {
      if (productId) {
        const productData = await getProductById(productId);
        if (productData) {
          form.reset({
            ...productData,
            kategori_id: Number(productData.kategori_id),
            satuan_id: Number(productData.satuan_id),
          });
        } else {
          router.push("/user/products"); // Redirect if not found
        }
      }
    };
    fetchProduct();
  }, [productId, getProductById, form, router, fetchDropdownData]);

  const onSubmit: SubmitHandler<ProductFormValues> = async (data) => {
    await editProduct(data as Product);
    toast({
      title: "Produk Diperbarui",
      description: "Perubahan pada produk telah berhasil disimpan.",
    });
    router.push("/user/products");
  };
  
  const handleAddMasterData = (type: 'category' | 'unit') => {
    setSheetType(type);
    setSheetOpen(true);
  }

  if (isFetching || !form.formState.isDirty) {
    return <div>Memuat data produk...</div>;
  }

  return (
    <div className="flex flex-col gap-4 py-4">
      <Card>
        <CardHeader>
          <CardTitle>Ubah Produk</CardTitle>
          <CardDescription>Perbarui detail produk.</CardDescription>
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
                      <FormLabel>Kode Produk</FormLabel>
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
                       <div className="flex items-center gap-2">
                        <Select onValueChange={(value) => field.onChange(Number(value))} value={String(field.value)} disabled={isSubmitting}>
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
                        <Button type="button" variant="outline" size="icon" onClick={() => handleAddMasterData('category')}>
                          <PlusCircle className="h-4 w-4" />
                        </Button>
                      </div>
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
                       <div className="flex items-center gap-2">
                        <Select onValueChange={(value) => field.onChange(Number(value))} value={String(field.value)} disabled={isSubmitting}>
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
                         <Button type="button" variant="outline" size="icon" onClick={() => handleAddMasterData('unit')}>
                          <PlusCircle className="h-4 w-4" />
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="stok"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stok</FormLabel>
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
                  Simpan Perubahan
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      <MasterDataSheet 
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        type={sheetType}
        onSuccess={fetchDropdownData}
      />
    </div>
  );
}
