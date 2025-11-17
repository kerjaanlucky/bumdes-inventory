"use client";

import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBranchStore } from "@/store/branch-store";
import { Branch } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

const branchSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Nama wajib diisi"),
  location: z.string().min(1, "Lokasi wajib diisi"),
  invoiceTemplate: z.enum(["sequential", "date", "custom"]).optional(),
  invoiceCustomFormat: z.string().optional(),
  defaultTax: z.coerce.number().optional(),
  phone: z.string().optional(),
  email: z.string().email({ message: "Alamat email tidak valid" }).optional().or(z.literal('')),
  taxType: z.enum(["inclusive", "exclusive"]).optional(),
  invoiceNotes: z.string().optional(),
});

type BranchFormValues = Branch;

export default function EditBranchPage() {
  const router = useRouter();
  const params = useParams();
  const { editBranch, getBranchById } = useBranchStore();
  const branchId = params.id as string;
  const branch = getBranchById(branchId);
  const [invoicePreview, setInvoicePreview] = useState("INV-001");

  const form = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema),
  });
  
  const invoiceTemplate = form.watch("invoiceTemplate");
  const customFormat = form.watch("invoiceCustomFormat");
  
  const handleTemplateChange = (value: string | undefined, customFormatValue?: string | null) => {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    switch(value) {
        case "sequential":
            setInvoicePreview("INV-001");
            break;
        case "date":
            setInvoicePreview(`INV-${year}${month}${day}-001`);
            break;
        case "custom":
            setInvoicePreview(customFormatValue || "Format Kustom Anda");
            break;
        default:
            setInvoicePreview("INV-001");
    }
  }

  useEffect(() => {
    if (branch) {
      form.reset(branch);
      handleTemplateChange(branch.invoiceTemplate, branch.invoiceCustomFormat);
    }
  }, [branch, form]);

  useEffect(() => {
    if (invoiceTemplate === 'custom') {
        handleTemplateChange('custom', customFormat);
    }
  }, [customFormat, invoiceTemplate]);

  const onSubmit: SubmitHandler<BranchFormValues> = (data) => {
    editBranch(data);
    router.push("/admin/branches");
  };

  if (!branch) {
    return <div>Cabang tidak ditemukan.</div>;
  }

  return (
    <div className="flex flex-col gap-4 py-4">
      <Card>
        <CardHeader>
          <CardTitle>Ubah Cabang</CardTitle>
          <CardDescription>Perbarui detail cabang di bawah ini.</CardDescription>
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
                 <div className="md:col-span-2 space-y-4">
                    <FormField
                    control={form.control}
                    name="invoiceTemplate"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Template Faktur</FormLabel>
                        <Select onValueChange={(value) => {
                            field.onChange(value);
                            handleTemplateChange(value, customFormat);
                        }} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih template faktur" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="sequential">Nomor Urut</SelectItem>
                                <SelectItem value="date">Tanggal Otomatis</SelectItem>
                                <SelectItem value="custom">Kustom</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    {invoiceTemplate === 'custom' && (
                         <FormField
                            control={form.control}
                            name="invoiceCustomFormat"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Format Faktur Kustom</FormLabel>
                                <FormControl>
                                    <Input placeholder="Contoh: {kode_cabang}-{tahun}-{bulan}-{nomor_urut}" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                    <div>
                        <FormLabel>Pratinjau Nomor Faktur</FormLabel>
                        <div className="mt-1">
                            <Badge variant="secondary">{invoicePreview}</Badge>
                        </div>
                    </div>
                </div>
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
                <Button type="submit">Simpan Perubahan</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
