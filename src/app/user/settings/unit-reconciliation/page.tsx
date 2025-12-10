"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useProductStore } from '@/store/product-store';
import { Loader2, Wand, CheckCircle, AlertCircle, FileSearch } from 'lucide-react';
import { Product } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

enum Stage {
  Idle,
  Analyzing,
  Analyzed,
  Fixing,
  Fixed,
  Error
}

export default function UnitReconciliationPage() {
  const [stage, setStage] = useState<Stage>(Stage.Idle);
  const [mismatchedData, setMismatchedData] = useState<{ count: number; products: Product[] }>({ count: 0, products: [] });
  const { reconcileUnitData, isSubmitting } = useProductStore();

  const handleAnalyze = async () => {
    setStage(Stage.Analyzing);
    const result = await reconcileUnitData(); // This function now just analyzes
    setMismatchedData(result);
    setStage(Stage.Analyzed);
  };
  
  const handleFix = async () => {
    setStage(Stage.Fixing);
    const result = await reconcileUnitData(); // This function now just analyzes
    if (result.count > 0) {
        toast({
            title: "Sukses!",
            description: `${result.count} data produk telah berhasil diperbaiki dan disinkronkan.`,
        });
        setStage(Stage.Fixed);
    } else {
        toast({
            title: "Tidak Ada Perbaikan",
            description: "Semua data sudah sinkron.",
        });
        setStage(Stage.Analyzed);
    }
    setMismatchedData({ count: 0, products: [] });
  };


  const renderContent = () => {
    switch (stage) {
      case Stage.Idle:
        return (
          <div className="text-center text-muted-foreground space-y-2">
            <FileSearch className="mx-auto h-12 w-12" />
            <p>Klik tombol "Analisis Sekarang" untuk memulai pemindaian.</p>
            <p className="text-xs">Alat ini akan memeriksa semua produk Anda dan membandingkan `nama_satuan` dengan ID yang benar di data master satuan.</p>
          </div>
        );
      case Stage.Analyzing:
        return (
            <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p>Menganalisis data produk...</p>
            </div>
        );
      case Stage.Analyzed:
        return (
          mismatchedData.count > 0 ? (
             <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-amber-500/10 border border-amber-500/50 rounded-lg">
                    <AlertCircle className="h-6 w-6 text-amber-600 mt-1"/>
                    <div>
                        <h3 className="font-semibold text-amber-800">Ditemukan {mismatchedData.count} Ketidakcocokan</h3>
                        <p className="text-sm text-amber-700">Produk di bawah ini memiliki `nama_satuan` yang ada di master data, tetapi `satuan_id`-nya tidak cocok. Klik "Perbaiki Data" untuk menyinkronkan.</p>
                    </div>
                </div>
                <ScrollArea className="h-64 border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nama Produk</TableHead>
                                <TableHead>Nama Satuan (Saat Ini)</TableHead>
                                <TableHead>ID Satuan (Salah)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {mismatchedData.products.map(p => (
                            <TableRow key={p.id}>
                                <TableCell>{p.nama_produk}</TableCell>
                                <TableCell><Badge variant="outline">{p.nama_satuan}</Badge></TableCell>
                                <TableCell className="font-mono text-xs text-red-500">{p.satuan_id}</TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </div>
          ) : (
             <div className="flex flex-col items-center justify-center gap-2 text-green-600">
                <CheckCircle className="h-10 w-10" />
                <p className="font-semibold">Semua data satuan produk sudah sinkron!</p>
            </div>
          )
        );
      case Stage.Fixing:
         return (
            <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p>Memperbaiki data... Ini mungkin memakan waktu beberapa saat.</p>
            </div>
        );
      case Stage.Fixed:
        return (
             <div className="flex flex-col items-center justify-center gap-2 text-green-600">
                <CheckCircle className="h-10 w-10" />
                <p className="font-semibold">Perbaikan Selesai!</p>
                <p className="text-sm text-center">Semua data produk yang tidak cocok telah berhasil disinkronkan.</p>
            </div>
        );
      default:
        return <p>Terjadi kesalahan.</p>;
    }
  };
  
  const renderButton = () => {
    switch (stage) {
      case Stage.Idle:
        return <Button onClick={handleAnalyze}><Wand className="mr-2 h-4 w-4"/>Analisis Sekarang</Button>;
      case Stage.Analyzing:
      case Stage.Fixing:
        return <Button disabled><Loader2 className="mr-2 h-4 w-4 animate-spin" />Memproses...</Button>;
      case Stage.Analyzed:
        return (
          mismatchedData.count > 0 ? (
            <Button onClick={handleFix}><Wand className="mr-2 h-4 w-4"/>Perbaiki Data ({mismatchedData.count})</Button>
          ) : (
            <Button onClick={handleAnalyze}>Analisis Ulang</Button>
          )
        );
      case Stage.Fixed:
        return <Button onClick={() => setStage(Stage.Idle)}>Mulai Lagi</Button>;
      default:
        return null;
    }
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle>Pemadanan Data Satuan</CardTitle>
        <CardDescription>
          Alat ini akan membantu Anda memperbaiki ketidaksinkronan data antara `nama_satuan` dan `satuan_id` pada koleksi produk Anda.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="min-h-[300px] flex items-center justify-center p-6 bg-muted/50 rounded-lg">
            {renderContent()}
        </div>
        <div className="flex justify-end mt-6">
            {renderButton()}
        </div>
      </CardContent>
    </Card>
  );
}
