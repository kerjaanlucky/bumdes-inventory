
"use client";

import { useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useSupplierStore } from "@/store/supplier-store";
import { Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

const supplierSchema = z.object({
  id: z.string(),
  nama_supplier: z.string().min(1, "Nama pemasok wajib diisi"),
  alamat: z.string().optional(),
  telepon: z.string().optional(),
  email: z.string().email({ message: "Alamat email tidak valid" }).optional().or(z.literal('')),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

export default function EditSupplierPage() {
  const router = useRouter();
  const params = useParams();
  const supplierId = params.id as string;
  const { editSupplier, getSupplierById, isSubmitting } = useSupplierStore();

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
  });

  useEffect(() => {
    const fetchSupplier = async () => {
      const supplierData = await getSupplierById(supplierId);
      if (supplierData) {
        form.reset(supplierData);
      } else {
        router.push("/user/suppliers"); // Redirect if not found
      }
    };
    if (supplierId) {
      fetchSupplier();
    }
  }, [supplierId, getSupplierById, form, router]);

  const onSubmit: SubmitHandler<SupplierFormValues> = async (data) => {
    await editSupplier(data as any);
    router.push("/user/suppliers");
  };
  
  const isFetching = useSupplierStore(state => state.isFetching);

  if (isFetching) {
    return <div>Memuat data pemasok...</div>;
  }

  return (
    <div className="flex flex-col gap-4 py-4">
      <Card>
        <CardHeader>
          <CardTitle>Ubah Pemasok</CardTitle>
          <CardDescription>Perbarui detail pemasok.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="nama_supplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Pemasok</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: PT Maju Jaya" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="sales@majujaya.com" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="telepon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nomor Telepon</FormLabel>
                    <FormControl>
                      <Input placeholder="021-88889999" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="alamat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alamat</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Jl. Industri Raya No. 1, Bekasi" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
    </div>
  );
}
