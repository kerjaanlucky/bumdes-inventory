

"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSaleStore } from '@/store/sale-store';
import { Sale, SaleStatus } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Edit, Truck, CheckCircle, PackageCheck, FileText, Ban, Undo2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfirmationDialog } from '@/components/common/confirmation-dialog';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';


const returnSchema = z.object({
  note: z.string().min(1, "Alasan retur wajib diisi."),
});

type ReturnFormValues = z.infer<typeof returnSchema>;

export default function SaleDetailPage() {
    const router = useRouter();
    const params = useParams();
    const saleId = params.id as string;
    const { getSaleById, isFetching, isSubmitting, updateSaleStatus } = useSaleStore();
    
    const [sale, setSale] = useState<Sale | null>(null);
    const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
    const [isReturnModalOpen, setReturnModalOpen] = useState(false);
    const [modalAction, setModalAction] = useState<{ status: SaleStatus; title: string; description: string } | null>(null);

    const returnForm = useForm<ReturnFormValues>({
      resolver: zodResolver(returnSchema),
    });

    const fetchAndSetSale = async () => {
        const data = await getSaleById(saleId);
        if (data) {
            setSale(data);
        } else {
            router.push('/user/sales');
        }
    };

    useEffect(() => {
        if (saleId) {
            fetchAndSetSale();
        }
    }, [saleId]);
    
    const getStatusVariant = (status: SaleStatus): "default" | "secondary" | "destructive" | "outline" => {
        switch (status) {
            case "LUNAS": return "default";
            case "DIRETUR": return "destructive";
            case "DIKONFIRMASI": return "secondary";
            case "DIKIRIM": return "secondary";
            case "DRAFT": return "outline";
            case "DIBATALKAN": return "destructive";
            default: return "secondary";
        }
    }
    
    const handleActionClick = (status: SaleStatus, title: string, description: string) => {
        if (status === 'DIRETUR') {
            setReturnModalOpen(true);
        } else {
            setModalAction({ status, title, description });
            setConfirmModalOpen(true);
        }
    };

    const handleConfirmAction = async () => {
        if (modalAction) {
            await updateSaleStatus(saleId, modalAction.status, `Status diubah menjadi ${modalAction.status}`);
            setConfirmModalOpen(false);
            setModalAction(null);
            await fetchAndSetSale(); // Re-fetch data to update UI without full reload
        }
    };
    
    const handleReturnSubmit = async (data: ReturnFormValues) => {
        await updateSaleStatus(saleId, 'DIRETUR', data.note);
        setReturnModalOpen(false);
        returnForm.reset();
        await fetchAndSetSale(); // Re-fetch data
    }


    if (isFetching && !sale) { // Show loader only on initial load
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    if (!sale) {
        return null; // or a not found component
    }

    const subtotal = sale.items?.reduce((sum, item) => sum + item.subtotal, 0) || 0;
    const totalDiscount = sale.items?.reduce((sum, item) => sum + (item.subtotal * (item.diskon / 100)), 0) || 0;
    const invDiscount = sale.diskon_invoice || 0;
    const taxType = sale.taxType || 'exclusive';
    const taxPercent = sale.pajak || 0;

    let dpp = subtotal - totalDiscount - invDiscount;
    let taxAmount = 0;

    if (taxType === 'inclusive') {
        taxAmount = dpp - (dpp / (1 + ((taxPercent || 0) / 100)));
        dpp = dpp - taxAmount;
    } else { // exclusive
        taxAmount = dpp * ((taxPercent || 0) / 100);
    }

    return (
        <div className="flex flex-col gap-4 py-4">
             <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Kembali</span>
                </Button>
                <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                    {sale.nomor_penjualan}
                </h1>
                <Badge variant={getStatusVariant(sale.status)} className="ml-auto sm:ml-0">
                    {sale.status.replace(/_/g, ' ')}
                </Badge>
                <div className="hidden items-center gap-2 md:ml-auto md:flex">
                     {sale.status === 'DRAFT' && (
                        <>
                            <Button variant="outline" size="sm" onClick={() => router.push(`/user/sales/${sale.id}/edit`)}>
                                <Edit className="mr-2 h-4 w-4" /> Ubah
                            </Button>
                            <Button size="sm" onClick={() => handleActionClick('DIKONFIRMASI', 'Konfirmasi Penjualan?', 'Tindakan ini akan mengunci penjualan dari pengeditan lebih lanjut.')}>
                                <CheckCircle className="mr-2 h-4 w-4" /> Konfirmasi
                            </Button>
                             <Button variant="outline" size="sm" onClick={() => router.push(`/user/sales/invoice/${sale.id}`)}>
                                <FileText className="mr-2 h-4 w-4" /> Lihat Faktur
                            </Button>
                             <Button variant="destructive" size="sm" onClick={() => handleActionClick('DIBATALKAN', 'Batalkan Penjualan?', 'Penjualan yang dibatalkan tidak dapat diproses lebih lanjut.')}>
                                <Ban className="mr-2 h-4 w-4" /> Batalkan
                            </Button>
                        </>
                    )}
                    {sale.status === 'DIKONFIRMASI' && (
                        <Button size="sm" onClick={() => handleActionClick('DIKIRIM', 'Kirim Barang?', 'Stok akan dikurangi sesuai dengan item pada penjualan ini.')}>
                            <Truck className="mr-2 h-4 w-4" /> Kirim Barang
                        </Button>
                    )}
                    {sale.status === 'DIKIRIM' && (
                        <Button size="sm" onClick={() => handleActionClick('LUNAS', 'Selesaikan Penjualan?', 'Tandai penjualan ini sebagai selesai dan lunas.')}>
                            <PackageCheck className="mr-2 h-4 w-4" /> Tandai Lunas
                        </Button>
                    )}
                     {sale.status === 'LUNAS' && (
                        <>
                            <Button variant="outline" size="sm" onClick={() => handleActionClick('DIRETUR', 'Proses Retur?', 'Status akan berubah menjadi DIRETUR dan stok akan dikembalikan ke persediaan.')}>
                                <Undo2 className="mr-2 h-4 w-4" /> Proses Retur
                            </Button>
                            <Button size="sm" onClick={() => router.push(`/user/sales/invoice/${sale.id}`)}>
                                <FileText className="mr-2 h-4 w-4" /> Lihat Faktur
                            </Button>
                        </>
                     )}
                </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
                <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
                     <Tabs defaultValue="details" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="details">Detail Penjualan</TabsTrigger>
                            <TabsTrigger value="log">Log Status</TabsTrigger>
                        </TabsList>
                        <TabsContent value="details">
                             <Card>
                                <CardHeader>
                                    <CardTitle>Detail Penjualan</CardTitle>
                                    <CardDescription>
                                        Pelanggan: {sale.nama_customer} <br />
                                        Tanggal: {format(new Date(sale.tanggal_penjualan), "dd MMMM yyyy")}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ScrollArea className="max-h-[calc(100vh-450px)]">
                                        <Table>
                                            <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[50px]">#</TableHead>
                                                <TableHead>Kode Produk</TableHead>
                                                <TableHead>Nama Produk</TableHead>
                                                <TableHead className="text-center">Jumlah</TableHead>
                                                <TableHead className="text-right">Harga</TableHead>
                                                <TableHead className="text-right">Diskon</TableHead>
                                                <TableHead className="text-right">Subtotal</TableHead>
                                            </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {sale.items?.map((item, index) => (
                                                    <TableRow key={item.id}>
                                                        <TableCell>{index + 1}</TableCell>
                                                        <TableCell className="font-mono text-xs">{item.kode_produk}</TableCell>
                                                        <TableCell>{item.nama_produk}</TableCell>
                                                        <TableCell className="text-center">{item.jumlah} {item.nama_satuan}</TableCell>
                                                        <TableCell className="text-right">Rp{item.harga_jual_satuan.toLocaleString('id-ID')}</TableCell>
                                                         <TableCell className="text-right">{item.diskon}%</TableCell>
                                                        <TableCell className="text-right">Rp{item.subtotal.toLocaleString('id-ID')}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="log">
                             <Card>
                                <CardHeader>
                                    <CardTitle>Riwayat Status</CardTitle>
                                    <CardDescription>Lacak semua perubahan status untuk penjualan ini.</CardDescription>
                                </CardHeader>
                                <CardContent className="text-sm">
                                    <ScrollArea className="max-h-[calc(100vh-450px)]">
                                        <ul className="space-y-4">
                                            {sale.history?.map((h, index) => (
                                            <li key={index} className="flex flex-col items-start gap-1">
                                                <div className='flex items-center gap-2'>
                                                    <Badge variant={getStatusVariant(h.status)}>{h.status.replace(/_/g, ' ')}</Badge>
                                                    <span className='text-xs text-muted-foreground'>{format(new Date(h.tanggal), "dd MMM yyyy, HH:mm")} oleh <strong>{h.oleh}</strong></span>
                                                </div>
                                                {h.catatan && (
                                                    <p className="pl-2 border-l-2 border-muted ml-2 text-muted-foreground text-xs italic">
                                                        "{h.catatan}"
                                                    </p>
                                                )}
                                            </li>
                                            ))}
                                        </ul>
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        </TabsContent>
                     </Tabs>
                </div>
                <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
                     <Card>
                        <CardHeader>
                            <CardTitle>Rincian Total</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Subtotal</span>
                                <span>Rp{subtotal.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Total Diskon Item</span>
                                <span>- Rp{totalDiscount.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Diskon Invoice</span>
                                <span>- Rp{invDiscount.toLocaleString('id-ID')}</span>
                            </div>
                            <Separator />
                            {taxType === 'inclusive' ? (
                                <>
                                <div className="flex justify-between font-medium">
                                    <span>DPP (Dasar Pengenaan Pajak)</span>
                                    <span>Rp{dpp.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>Pajak Termasuk ({taxPercent}%)</span>
                                    <span>Rp{taxAmount.toLocaleString('id-ID')}</span>
                                </div>
                                </>
                            ) : (
                                taxAmount > 0 && (
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                        <span>Pajak ({taxPercent}%)</span>
                                        <span>+ Rp{taxAmount.toLocaleString('id-ID')}</span>
                                    </div>
                                )
                            )}
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Ongkos Kirim</span>
                                <span>+ Rp{(sale.ongkos_kirim || 0).toLocaleString('id-ID')}</span>
                            </div>
                             <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Biaya Lain-lain</span>
                                <span>+ Rp{(sale.biaya_lain || 0).toLocaleString('id-ID')}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-semibold text-lg">
                                <span>Grand Total</span>
                                <span>Rp{sale.total_harga.toLocaleString('id-ID')}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
            <ConfirmationDialog
                isOpen={isConfirmModalOpen}
                onClose={() => setConfirmModalOpen(false)}
                onConfirm={handleConfirmAction}
                title={modalAction?.title || ''}
                description={modalAction?.description || ''}
                isSubmitting={isSubmitting}
            />
             <ConfirmationDialog
                isOpen={isReturnModalOpen}
                onClose={() => setReturnModalOpen(false)}
                onConfirm={returnForm.handleSubmit(handleReturnSubmit)}
                title="Proses Retur Penjualan?"
                description="Tindakan ini akan mengembalikan stok barang ke persediaan. Pastikan Anda telah menerima barang kembali dari pelanggan."
                isSubmitting={isSubmitting}
            >
                <Form {...returnForm}>
                    <form className="space-y-4 mt-4">
                        <FormField
                        control={returnForm.control}
                        name="note"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Alasan Retur</FormLabel>
                            <FormControl>
                                <Textarea
                                placeholder="Contoh: Barang rusak saat diterima, salah kirim ukuran, dll."
                                {...field}
                                />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </form>
                </Form>
            </ConfirmationDialog>
        </div>
    );

    
}
