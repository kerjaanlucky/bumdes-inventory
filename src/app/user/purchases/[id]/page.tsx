
"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { usePurchaseStore } from '@/store/purchase-store';
import { Purchase, PurchaseItem, PurchaseStatus } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Edit, Truck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ReceiveItemsModal } from '../receive-items-modal';

export default function PurchaseDetailPage() {
    const router = useRouter();
    const params = useParams();
    const purchaseId = Number(params.id);
    const { getPurchaseById, isFetching, updatePurchaseStatus } = usePurchaseStore();
    
    const [purchase, setPurchase] = useState<Purchase | null>(null);
    const [isReceiveModalOpen, setReceiveModalOpen] = useState(false);

    useEffect(() => {
        const fetchPurchase = async () => {
            const data = await getPurchaseById(purchaseId);
            if (data) {
                setPurchase(data);
            } else {
                router.push('/user/purchases');
            }
        };
        fetchPurchase();
    }, [purchaseId, getPurchaseById, router]);
    
    const getStatusVariant = (status: PurchaseStatus): "default" | "secondary" | "destructive" | "outline" => {
        switch (status) {
            case "DITERIMA_PENUH": return "default";
            case "DIPESAN": return "secondary";
            case "DRAFT": return "outline";
            case "DITERIMA_SEBAGIAN": return "secondary";
            case "DIBATALKAN": return "destructive";
            default: return "outline";
        }
    }
    
    const handleUpdateStatus = async (newStatus: PurchaseStatus) => {
        if (!purchase) return;
        await updatePurchaseStatus(purchase.id, newStatus);
        const updatedPurchase = await getPurchaseById(purchase.id);
        if (updatedPurchase) setPurchase(updatedPurchase);
    }
    
    const handleReceiveSubmit = async (items: PurchaseItem[]) => {
        if (!purchase) return;
        
        // Logic to determine new status
        const totalOrdered = purchase.items?.reduce((sum, item) => sum + item.jumlah, 0) || 0;
        const totalReceived = items.reduce((sum, item) => sum + item.jumlah_diterima, 0);
        const newStatus = totalReceived >= totalOrdered ? 'DITERIMA_PENUH' : 'DITERIMA_SEBAGIAN';

        const updatedPurchase = {
            ...purchase,
            items,
            status: newStatus,
        };
        await usePurchaseStore.getState().editPurchase(updatedPurchase);
        setPurchase(updatedPurchase);
        setReceiveModalOpen(false);
    }


    if (isFetching || !purchase) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    const subtotal = purchase.items?.reduce((sum, item) => sum + item.subtotal, 0) || 0;
    const totalDiscount = purchase.items?.reduce((sum, item) => sum + (item.subtotal * (item.diskon / 100)), 0) || 0;
    const dpp = subtotal - totalDiscount - (purchase.diskon_invoice || 0);
    const taxAmount = dpp * ((purchase.pajak || 0) / 100);


    return (
        <div className="flex flex-col gap-4 py-4">
             <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Kembali</span>
                </Button>
                <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                    {purchase.nomor_pembelian}
                </h1>
                <Badge variant={getStatusVariant(purchase.status)} className="ml-auto sm:ml-0">
                    {purchase.status.replace(/_/g, ' ')}
                </Badge>
                <div className="hidden items-center gap-2 md:ml-auto md:flex">
                     {purchase.status === 'DRAFT' && (
                        <>
                            <Button variant="outline" size="sm" onClick={() => router.push(`/user/purchases/${purchase.id}/edit`)}>
                                <Edit className="mr-2 h-4 w-4" /> Ubah
                            </Button>
                            <Button size="sm" onClick={() => handleUpdateStatus('DIPESAN')}>Kirim Pesanan</Button>
                        </>
                    )}
                    {purchase.status === 'DIPESAN' && (
                        <Button size="sm" onClick={() => setReceiveModalOpen(true)}>
                            <Truck className="mr-2 h-4 w-4" /> Proses Penerimaan Barang
                        </Button>
                    )}
                </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
                <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
                     <Card>
                        <CardHeader>
                            <CardTitle>Detail Pesanan Pembelian</CardTitle>
                            <CardDescription>
                                Pemasok: {purchase.nama_supplier} <br />
                                Tanggal: {format(new Date(purchase.tanggal_pembelian), "dd MMMM yyyy")}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                <TableRow>
                                    <TableHead>Produk</TableHead>
                                    <TableHead>Jumlah</TableHead>
                                    <TableHead className="text-right">Harga Satuan</TableHead>
                                    <TableHead className="text-right">Subtotal</TableHead>
                                </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {purchase.items?.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell>{item.nama_produk}</TableCell>
                                            <TableCell>{item.jumlah} {item.nama_satuan}</TableCell>
                                            <TableCell className="text-right">Rp{item.harga_beli_satuan.toLocaleString('id-ID')}</TableCell>
                                            <TableCell className="text-right">Rp{item.subtotal.toLocaleString('id-ID')}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle>Riwayat Status</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm">
                             <ul>
                                {purchase.history?.map((h, index) => (
                                <li key={index} className="flex items-center gap-4 mb-2">
                                    <Badge variant={getStatusVariant(h.status)}>{h.status.replace(/_/g, ' ')}</Badge>
                                    <span>{format(new Date(h.tanggal), "dd MMM yyyy, HH:mm")} oleh <strong>{h.oleh}</strong></span>
                                </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
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
                                <span>- Rp{(purchase.diskon_invoice || 0).toLocaleString('id-ID')}</span>
                            </div>
                             <Separator />
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Pajak ({purchase.pajak || 0}%)</span>
                                <span>+ Rp{taxAmount.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Ongkos Kirim</span>
                                <span>+ Rp{(purchase.ongkos_kirim || 0).toLocaleString('id-ID')}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-semibold">
                                <span>Grand Total</span>
                                <span>Rp{purchase.total_harga.toLocaleString('id-ID')}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
             {isReceiveModalOpen && purchase.items && (
                <ReceiveItemsModal
                    isOpen={isReceiveModalOpen}
                    onClose={() => setReceiveModalOpen(false)}
                    items={purchase.items}
                    onSubmit={handleReceiveSubmit}
                />
            )}
        </div>
    );
}
