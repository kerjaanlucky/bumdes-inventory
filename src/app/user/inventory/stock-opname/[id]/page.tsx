
"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useStockOpnameStore } from '@/store/stock-opname-store';
import { StockOpname, StockOpnameStatus, StockOpnameItem } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Edit, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { ConfirmationDialog } from '@/components/common/confirmation-dialog';

export default function StockOpnameDetailPage() {
    const router = useRouter();
    const params = useParams();
    const opnameId = params.id as string;
    const { getStockOpnameById, finalizeStockOpname, isFetching, isSubmitting } = useStockOpnameStore();
    
    const [opname, setOpname] = useState<StockOpname | null>(null);
    const [isFinalizeModalOpen, setFinalizeModalOpen] = useState(false);

    useEffect(() => {
        const fetchOpname = async () => {
            const data = await getStockOpnameById(opnameId);
            if (data) {
                setOpname(data);
            } else {
                router.push('/user/inventory/stock-opname');
            }
        };
        if (opnameId) {
            fetchOpname();
        }
    }, [opnameId, getStockOpnameById, router]);
    
    const getStatusVariant = (status: StockOpnameStatus): "default" | "secondary" => {
        return status === 'SELESAI' ? 'default' : 'secondary';
    }
    
    const handleFinalize = async () => {
        await finalizeStockOpname(opnameId);
        setFinalizeModalOpen(false);
        const data = await getStockOpnameById(opnameId);
        setOpname(data); // Re-fetch to show updated status
    }

    if (isFetching || !opname) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 py-4">
             <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Kembali</span>
                </Button>
                <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                    {opname.nomor_referensi}
                </h1>
                <Badge variant={getStatusVariant(opname.status)} className="ml-auto sm:ml-0">
                    {opname.status}
                </Badge>
                <div className="hidden items-center gap-2 md:ml-auto md:flex">
                     {opname.status === 'DRAFT' && (
                        <>
                            <Button variant="outline" size="sm" onClick={() => router.push(`/user/inventory/stock-opname/${opname.id}/edit`)}>
                                <Edit className="mr-2 h-4 w-4" /> Ubah
                            </Button>
                            <Button size="sm" onClick={() => setFinalizeModalOpen(true)}>
                                <CheckCircle2 className="mr-2 h-4 w-4" /> Selesaikan & Sesuaikan Stok
                            </Button>
                        </>
                    )}
                </div>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Detail Stock Opname</CardTitle>
                    <CardDescription>
                        Tanggal: {format(new Date(opname.tanggal), "dd MMMM yyyy")} <br/>
                        Catatan: {opname.catatan || '-'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Produk</TableHead>
                            <TableHead className="text-center">Stok Sistem</TableHead>
                            <TableHead className="text-center">Stok Fisik</TableHead>
                            <TableHead className="text-center">Selisih</TableHead>
                            <TableHead>Keterangan</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                            {opname.items?.map(item => (
                                <TableRow key={item.produk_id}>
                                    <TableCell>
                                        <div className="font-medium">{item.nama_produk}</div>
                                        <div className="text-xs text-muted-foreground font-mono">{item.kode_produk}</div>
                                    </TableCell>
                                    <TableCell className="text-center">{item.stok_sistem}</TableCell>
                                    <TableCell className="text-center">{item.stok_fisik}</TableCell>
                                    <TableCell className={cn("text-center font-bold", item.selisih > 0 ? 'text-green-600' : item.selisih < 0 ? 'text-red-600' : '')}>
                                        {item.selisih > 0 ? `+${item.selisih}` : item.selisih}
                                    </TableCell>
                                    <TableCell>{item.keterangan}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <ConfirmationDialog
                isOpen={isFinalizeModalOpen}
                onClose={() => setFinalizeModalOpen(false)}
                onConfirm={handleFinalize}
                title="Selesaikan Stock Opname?"
                description="Tindakan ini tidak dapat dibatalkan. Stok produk akan diperbarui sesuai dengan hitungan fisik, dan pergerakan stok akan dicatat untuk setiap penyesuaian."
                isSubmitting={isSubmitting}
            />
        </div>
    );
}
