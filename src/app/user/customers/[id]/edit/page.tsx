
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
import { useCustomerStore } from "@/store/customer-store";
import { Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

const customerSchema = z.object({
  id: z.string(),
  nama_customer: z.string().min(1, "Nama pelanggan wajib diisi"),
  alamat: z.string().optional(),
  telepon: z.string().optional(),
  email: z.string().email({ message: "Alamat email tidak valid" }).optional().or(z.literal('')),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

export default function EditCustomerPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;
  const { editCustomer, getCustomerById, isSubmitting } = useCustomerStore();

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
  });

  useEffect(() => {
    const fetchCustomer = async () => {
      const customerData = await getCustomerById(customerId);
      if (customerData) {
        form.reset(customerData);
      } else {
        router.push("/user/customers"); // Redirect if not found
      }
    };
    if (customerId) {
      fetchCustomer();
    }
  }, [customerId, getCustomerById, form, router]);

  const onSubmit: SubmitHandler<CustomerFormValues> = async (data) => {
    await editCustomer(data as any);
    router.push("/user/customers");
  };
  
  const isFetching = useCustomerStore(state => state.isFetching);

  if (isFetching) {
    return <div>Memuat data pelanggan...</div>;
  }

  return (
    <div className="flex flex-col gap-4 py-4">
      <Card>
        <CardHeader>
          <CardTitle>Ubah Pelanggan</CardTitle>
          <CardDescription>Perbarui detail pelanggan.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="nama_customer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Pelanggan</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Budi Santoso" {...field} disabled={isSubmitting} />
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
                      <Input type="email" placeholder="budi.s@example.com" {...field} disabled={isSubmitting} />
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
                      <Input placeholder="081234567890" {...field} disabled={isSubmitting} />
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
                      <Textarea placeholder="Jl. Merdeka No. 10, Jakarta" {...field} disabled={isSubmitting} />
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
