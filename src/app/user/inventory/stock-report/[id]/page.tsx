
"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useStockStore, StockReport } from '@/store/stock-store';
import { useProductStore } from '@/store/product-store';
import { Product } from '@/lib/types';
import { Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { DateRange } from 'react-day-picker';

export default function StockCardReportPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = params.id as string;
  
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const { fetchStockReport, isFetching: isReportFetching } = useStockStore();
  const { getProductById, isFetching: isProductFetching } = useProductStore();

  const [reportData, setReportData] = useState<StockReport | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  
  useEffect(() => {
    async function fetchData() {
      if (productId && from && to) {
        const range = { from: parseISO(from), to: parseISO(to) };
        setDateRange(range);
        
        const productData = await getProductById(productId);
        setProduct(productData || null);

        const report = await fetchStockReport(productId, range);
        setReportData(report);
      } else {
        // Redirect if parameters are missing
        router.push('/user/inventory/stock-report');
      }
    }
    fetchData();
  }, [productId, from, to, getProductById, fetchStockReport, router]);
  
  const handlePrint = () => {
    window.print();
  };

  const isLoading = isReportFetching || isProductFetching || !product;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Membuat laporan kartu stok...</p>
        </div>
      </div>
    );
  }

  if (!reportData) {
     return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Tidak dapat memuat data laporan.</p>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-4xl mx-auto p-4 sm:p-8 print:p-0">
        <div className="flex justify-between items-center mb-6 print:hidden">
          <h1 className="text-2xl font-bold">Kartu Stok</h1>
          <Button onClick={handlePrint} variant="outline">
            <Printer className="mr-2 h-4 w-4" />
            Cetak Laporan
          </Button>
        </div>

        <div className="bg-card border rounded-lg p-8 print:border-none print:shadow-none print:p-0">
          <header className="text-center mb-8">
            <h1 className="text-2xl font-bold uppercase">Kartu Stok</h1>
            <p className="text-muted-foreground">
              Periode: {dateRange?.from && format(dateRange.from, 'dd MMM yyyy')} - {dateRange?.to && format(dateRange.to, 'dd MMM yyyy')}
            </p>
          </header>

          <section className="mb-8">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Kode Produk</p>
                <p className="font-semibold">{product?.kode_produk}</p>
              </div>
               <div>
                <p className="text-muted-foreground">Nama Produk</p>
                <p className="font-semibold">{product?.nama_produk}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Satuan</p>
                <p className="font-semibold">{product?.nama_satuan}</p>
              </div>
            </div>
          </section>

          <section>
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr className="text-left">
                  <th className="p-2 font-semibold">Tanggal</th>
                  <th className="p-2 font-semibold">Referensi</th>
                  <th className="p-2 font-semibold">Keterangan</th>
                  <th className="p-2 text-right font-semibold">Masuk</th>
                  <th className="p-2 text-right font-semibold">Keluar</th>
                  <th className="p-2 text-right font-semibold">Saldo</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b font-semibold">
                    <td colSpan={5} className="p-2">Saldo Awal</td>
                    <td className="p-2 text-right">{reportData.openingBalance}</td>
                </tr>
                {reportData.movements.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-2">{format(new Date(item.tanggal), 'dd/MM/yy HH:mm')}</td>
                    <td className="p-2 font-mono text-xs">{item.referensi}</td>
                    <td className="p-2">{item.tipe}</td>
                    <td className="p-2 text-right text-green-600">{item.jumlah > 0 ? item.jumlah : '-'}</td>
                    <td className="p-2 text-right text-red-600">{item.jumlah < 0 ? Math.abs(item.jumlah) : '-'}</td>
                    <td className="p-2 text-right font-medium">{item.stok_akhir}</td>
                  </tr>
                ))}
                 <tr className="border-b font-semibold bg-muted">
                    <td colSpan={5} className="p-2">Saldo Akhir</td>
                    <td className="p-2 text-right">{reportData.closingBalance}</td>
                </tr>
              </tbody>
            </table>
          </section>
        </div>
      </div>
       <style jsx global>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print\:hidden { display: none; }
          .print\:p-0 { padding: 0; }
          .print\:border-none { border: none; }
          .print\:shadow-none { box-shadow: none; }
          .bg-muted { background-color: #f1f5f9 !important; }
        }
      `}</style>
    </div>
  );
}

    