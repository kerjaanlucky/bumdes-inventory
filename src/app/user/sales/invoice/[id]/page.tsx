
"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSaleStore } from '@/store/sale-store';
import { useBranchStore } from '@/store/branch-store';
import { useAuthStore } from '@/store/auth-store';
import { Sale, Branch } from '@/lib/types';
import { Loader2, Printer, Download, Combine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';

export default function InvoicePage() {
  const params = useParams();
  const router = useRouter();
  const saleId = params.id as string;

  const { getSaleById, isFetching: isSaleFetching } = useSaleStore();
  const { getBranchById, isFetching: isBranchFetching } = useBranchStore();
  const { userProfile } = useAuthStore();
  
  const [sale, setSale] = useState<Sale | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (saleId) {
        const saleData = await getSaleById(saleId);
        if (saleData) {
          setSale(saleData);
          if (userProfile?.branchId) {
            const branchData = getBranchById(userProfile.branchId);
            setBranch(branchData || null);
          }
        } else {
          router.push('/user/sales');
        }
      }
    }
    fetchData();
  }, [saleId, getSaleById, getBranchById, userProfile, router]);
  
  const handlePrint = () => {
    window.print();
  };

  const isLoading = isSaleFetching || isBranchFetching || !sale || !branch;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  const subtotal = sale.items.reduce((acc, item) => acc + item.subtotal, 0);
  const totalItemDiscount = sale.items.reduce((acc, item) => acc + (item.subtotal * (item.diskon / 100)), 0);
  const invoiceDiscount = sale.diskon_invoice || 0;
  
  const dppBeforeTax = subtotal - totalItemDiscount - invoiceDiscount;

  let dpp = dppBeforeTax;
  let taxAmount = 0;
  
  if (sale.taxType === 'inclusive') {
    taxAmount = dppBeforeTax - (dppBeforeTax / (1 + (sale.pajak / 100)));
    dpp = dppBeforeTax - taxAmount;
  } else { // exclusive
    taxAmount = dppBeforeTax * ((sale.pajak || 0) / 100);
  }


  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-4xl mx-auto p-4 sm:p-8 print:p-0">
        <div className="flex justify-between items-center mb-6 print:hidden">
          <h1 className="text-2xl font-bold">Faktur Penjualan</h1>
          <div className="flex gap-2">
            <Button onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Cetak / Simpan PDF
            </Button>
          </div>
        </div>

        <div className="bg-card border rounded-lg p-8 print:border-none print:shadow-none print:p-0">
          <header className="flex justify-between items-start pb-6 border-b">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-primary">{branch?.name}</h2>
              <p className="text-muted-foreground text-sm">{branch?.location}</p>
              <p className="text-muted-foreground text-sm">Email: {branch?.email}</p>
              <p className="text-muted-foreground text-sm">Telepon: {branch?.phone}</p>
            </div>
            <div className="text-right">
              <h1 className="text-4xl font-bold uppercase tracking-wider text-primary">FAKTUR</h1>
              <p className="text-muted-foreground">#{sale.nomor_penjualan}</p>
            </div>
          </header>

          <section className="grid grid-cols-2 gap-4 my-6">
            <div>
              <h3 className="font-semibold mb-2">Ditagih Kepada:</h3>
              <p className="font-bold">{sale.nama_customer}</p>
            </div>
            <div className="text-right space-y-1">
              <p>
                <span className="font-semibold">Tanggal Faktur: </span>
                {format(new Date(sale.tanggal_penjualan), 'dd MMMM yyyy')}
              </p>
              <p>
                <span className="font-semibold">Tanggal Jatuh Tempo: </span>
                {format(new Date(sale.tanggal_penjualan).setDate(new Date(sale.tanggal_penjualan).getDate() + 30), 'dd MMMM yyyy')}
              </p>
            </div>
          </section>

          <section>
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="p-2 text-left font-semibold">Deskripsi</th>
                  <th className="p-2 text-center font-semibold">Jumlah</th>
                  <th className="p-2 text-right font-semibold">Harga Satuan</th>
                  <th className="p-2 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {sale.items.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-2">{item.nama_produk}</td>
                    <td className="p-2 text-center">{item.jumlah}</td>
                    <td className="p-2 text-right">Rp{item.harga_jual_satuan.toLocaleString('id-ID')}</td>
                    <td className="p-2 text-right">Rp{item.subtotal.toLocaleString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="flex justify-end mt-6">
            <div className="w-full max-w-sm space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>Rp{subtotal.toLocaleString('id-ID')}</span>
              </div>
              {totalItemDiscount > 0 && (
                 <div className="flex justify-between">
                    <span className="text-muted-foreground">Diskon Item</span>
                    <span className="text-red-500">- Rp{totalItemDiscount.toLocaleString('id-ID')}</span>
                </div>
              )}
               {invoiceDiscount > 0 && (
                 <div className="flex justify-between">
                    <span className="text-muted-foreground">Diskon Invoice</span>
                    <span className="text-red-500">- Rp{invoiceDiscount.toLocaleString('id-ID')}</span>
                </div>
              )}
              <Separator />
               <div className="flex justify-between">
                <span className="text-muted-foreground">DPP</span>
                <span>Rp{dpp.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pajak ({sale.pajak}%)</span>
                <span>Rp{taxAmount.toLocaleString('id-ID')}</span>
              </div>
               <div className="flex justify-between">
                <span className="text-muted-foreground">Ongkos Kirim</span>
                <span>Rp{sale.ongkos_kirim.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Biaya Lain-lain</span>
                <span>Rp{sale.biaya_lain.toLocaleString('id-ID')}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>TOTAL</span>
                <span>Rp{sale.total_harga.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </section>

          <footer className="mt-12 pt-6 border-t">
            <h3 className="font-semibold mb-2">Catatan:</h3>
            <p className="text-xs text-muted-foreground">
              {branch.invoiceNotes || "Terima kasih atas bisnis Anda. Silakan hubungi kami jika ada pertanyaan mengenai faktur ini."}
            </p>
            <div className="flex items-center justify-center mt-8 text-xs text-muted-foreground">
                <Combine className="h-4 w-4 mr-2" />
                Dibuat dengan InventoryFlow
            </div>
          </footer>
        </div>
      </div>
       <style jsx global>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print\:hidden {
            display: none;
          }
          .print\:p-0 {
            padding: 0;
          }
           .print\:border-none {
            border: none;
          }
           .print\:shadow-none {
            box-shadow: none;
          }
        }
      `}</style>
    </div>
  );
}
