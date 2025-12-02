"use client";

import { useEffect, useState } from "react";
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
import { useAuthStore } from "@/store/auth-store";
import { Branch } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

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

export default function SettingsPage() {
  const router = useRouter();
  const { userProfile } = useAuthStore();
  const { editBranch, getBranchById, isSubmitting, fetchBranches } = useBranchStore();
  const { toast } = useToast();
  
  const [branch, setBranch] = useState<Branch | undefined>(undefined);
  const [invoicePreview, setInvoicePreview] = useState("INV-001");

  const form = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema),
  });

  useEffect(() => {
    const fetchAndSetBranch = async () => {
      await fetchBranches();
      if (userProfile?.branchId) {
        const branchData = getBranchById(userProfile.branchId);
        if (branchData) {
          setBranch(branchData);
          form.reset(branchData);
          handleTemplateChange(branchData.invoiceTemplate, branchData.invoiceCustomFormat);
        } else {
          toast({ variant: "destructive", title: "Cabang tidak ditemukan", description: "Pengaturan untuk cabang Anda tidak dapat dimuat." });
        }
      }
    };

    fetchAndSetBranch();
  }, [userProfile, fetchBranches, getBranchById, form, toast]);
  
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
    if (invoiceTemplate === 'custom') {
        handleTemplateChange('custom', customFormat);
    }
  }, [customFormat, invoiceTemplate]);

  const onSubmit: SubmitHandler<BranchFormValues> = async (data) => {
    await editBranch(data);
    toast({
      title: "Pengaturan Disimpan",
      description: "Perubahan pada pengaturan cabang telah berhasil disimpan.",
    });
  };

  if (!branch) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4">
      <Card>
        <CardHeader>
          <CardTitle>Pengaturan Cabang</CardTitle>
          <CardDescription>Kelola detail, pajak, dan pengaturan faktur untuk cabang Anda.</CardDescription>
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
                      <FormLabel>Nama Cabang</FormLabel>
                      <FormControl>
                        <Input placeholder="Cabang Utama" {...field} disabled={isSubmitting} />
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
                        <Input placeholder="Jakarta, Indonesia" {...field} disabled={isSubmitting} />
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
                        <Input placeholder="0812-3456-7890" {...field} value={field.value || ''} disabled={isSubmitting} />
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
                      <FormLabel>Email Cabang</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="cabang@example.com" {...field} value={field.value || ''} disabled={isSubmitting} />
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
                        <Input type="number" placeholder="11" {...field} value={field.value || 0} disabled={isSubmitting} />
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
                      <FormLabel>Tipe Pajak Default</FormLabel>
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
                 <div className="md:col-span-2 space-y-4">
                    <FormField
                    control={form.control}
                    name="invoiceTemplate"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Template Faktur</FormLabel>
                        <Select onValueChange={(value) => {
                            field.onChange(value);
                            handleTemplateChange(value, form.getValues('invoiceCustomFormat'));
                        }} value={field.value} disabled={isSubmitting}>
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
                                    <Input placeholder="Contoh: {kode_cabang}-{tahun}-{bulan}-{nomor_urut}" {...field} value={field.value || ''} disabled={isSubmitting} />
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
                      <FormLabel>Catatan Faktur Default</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Terima kasih atas bisnis Anda!" {...field} value={field.value || ''} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              <div className="flex justify-end gap-2 pt-4">
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
