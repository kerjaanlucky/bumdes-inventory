"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBranchStore } from "@/store/branch-store";
import { useUserStore } from "@/store/user-store";

const branchSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  location: z.string().min(1, "Lokasi wajib diisi"),
  manager: z.string().min(1, "Manajer wajib diisi"),
  invoiceTemplate: z.string().optional(),
  defaultTax: z.coerce.number().optional(),
  phone: z.string().optional(),
  email: z.string().email({ message: "Alamat email tidak valid" }).optional().or(z.literal('')),
  taxType: z.enum(["inclusive", "exclusive"]).optional(),
  invoiceNotes: z.string().optional(),
});

type BranchFormValues = z.infer<typeof branchSchema>;

export default function NewBranchPage() {
  const router = useRouter();
  const { addBranch } = useBranchStore();
  const { users } = useUserStore();

  const form = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      name: "",
      location: "",
      manager: "",
      invoiceTemplate: "",
      defaultTax: 0,
      phone: "",
      email: "",
      taxType: "exclusive",
      invoiceNotes: "",
    },
  });

  const onSubmit: SubmitHandler<BranchFormValues> = (data) => {
    addBranch(data);
    router.push("/admin/branches");
  };

  return (
    <div className="flex flex-col gap-4 py-4">
      <Card>
        <CardHeader>
          <CardTitle>Tambah Cabang Baru</CardTitle>
          <CardDescription>Isi formulir untuk membuat cabang baru.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama</FormLabel>
                      <FormControl>
                        <Input placeholder="Cabang Utama" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lokasi</FormLabel>
                      <FormControl>
                        <Input placeholder="Jakarta, Indonesia" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="manager"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manajer</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih manajer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {users.map(user => (
                            <SelectItem key={user.id} value={user.name}>{user.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nomor Telepon Cabang</FormLabel>
                      <FormControl>
                        <Input placeholder="0812-3456-7890" {...field} />
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
                        <Input type="email" placeholder="cabang@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="defaultTax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pajak Default (%)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="taxType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipe Pajak</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  name="invoiceTemplate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template Faktur</FormLabel>
                       <FormControl>
                        <Input placeholder="Template Standar" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                  control={form.control}
                  name="invoiceNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catatan Faktur</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Terima kasih atas bisnis Anda!" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Batal
                </Button>
                <Button type="submit">Tambah Cabang</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
