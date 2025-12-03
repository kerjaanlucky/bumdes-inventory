

"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSaleStore } from '@/store/sale-store';
import { useBranchStore } from '@/store/branch-store';
import { useAuthStore } from '@/store/auth-store';
import { Sale, Branch } from '@/lib/types';
import { Loader2, Printer, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { SuratJalanModal } from './surat-jalan-modal';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';


type DocumentType = 'invoice' | 'suratJalan';

export default function InvoicePage() {
  const params = useParams();
  const router = useRouter();
  const saleId = params.id as string;

  const { getSaleById, isFetching: isSaleFetching } = useSaleStore();
  const { getBranchById, isFetching: isBranchFetching } = useBranchStore();
  const { userProfile } = useAuthStore();
  
  const [sale, setSale] = useState<Sale | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>('invoice');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [customerAddress, setCustomerAddress] = useState('N/A');

  const printAreaRef = useRef<HTMLDivElement>(null);


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
          // Assuming customer details are needed, this should be fetched properly.
          // This is a placeholder as customer data is not directly on the sale object.
          // In a real app, you might fetch customer details here.
          setCustomerAddress(saleData.customer_id ? "Alamat Pelanggan..." : "N/A");
        } else {
          router.push('/user/sales');
        }
      }
    }
    fetchData();
  }, [saleId, getSaleById, getBranchById, userProfile, router]);
  
  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
        window.print();
        setIsPrinting(false);
    }, 100);
  };
  
  const handleDownloadPdf = async (type: DocumentType) => {
    if (!printAreaRef.current) return;
    setIsDownloading(true);
    setDocumentType(type); // Set document type before rendering for PDF
    
    // Allow state to update and re-render
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const canvas = await html2canvas(printAreaRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/jpeg', 0.8);
    
    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = imgWidth / imgHeight;

    let widthInPdf = pdfWidth;
    let heightInPdf = widthInPdf / ratio;

    if (heightInPdf > pdfHeight) {
        heightInPdf = pdfHeight;
        widthInPdf = heightInPdf * ratio;
    }
    
    const x = (pdfWidth - widthInPdf) / 2;
    const y = 0;

    pdf.addImage(imgData, 'JPEG', x, y, widthInPdf, heightInPdf);
    pdf.save(`${type}-${sale?.nomor_penjualan}.pdf`);

    setIsDownloading(false);
  };

  const handleSuratJalanClick = () => {
      setIsModalOpen(true);
  }

  const handleSuratJalanSubmit = (vehicle: string) => {
    setVehicleNumber(vehicle);
    setIsModalOpen(false);
    handleDownloadPdf('suratJalan');
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
  const totalDiscount = totalItemDiscount + invoiceDiscount;
  
  const dppBeforeTax = subtotal - totalItemDiscount - invoiceDiscount;

  let dpp = dppBeforeTax;
  let taxAmount = 0;
  
  if (sale.taxType === 'inclusive') {
    taxAmount = dppBeforeTax - (dppBeforeTax / (1 + ((sale.pajak || 0) / 100)));
    dpp = dppBeforeTax - taxAmount;
  } else { // exclusive
    taxAmount = dppBeforeTax * ((sale.pajak || 0) / 100);
  }
  
  const ongkosKirim = sale.ongkos_kirim || 0;

  return (
    <>
      <div className="bg-background min-h-screen">
        <div className="max-w-4xl mx-auto p-4 sm:p-8 print:p-0">
          <div className="flex justify-between items-center mb-6 print:hidden">
            <h1 className="text-2xl font-bold">Dokumen Penjualan</h1>
            <div className="flex gap-2">
              <Button onClick={() => handleDownloadPdf('invoice')} variant="outline" disabled={isDownloading}>
                {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Download PDF Faktur
              </Button>
               <Button onClick={handleSuratJalanClick} disabled={isDownloading}>
                <FileText className="mr-2 h-4 w-4" />
                Buat PDF Surat Jalan
              </Button>
            </div>
          </div>

          <div ref={printAreaRef} className="bg-card border rounded-lg p-6 print:border-none print:shadow-none print:p-0 text-gray-800 relative">
             {sale.status === 'DRAFT' && documentType === 'invoice' && (
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                    <div className="text-[8rem] sm:text-[10rem] font-bold text-gray-200/80 -rotate-45 select-none">
                        DRAFT
                    </div>
                </div>
            )}
            
            {/* Header */}
            <div className="flex justify-between items-start pb-4 border-b">
              <div className="space-y-1 text-xs sm:text-sm">
                <h2 className="text-base sm:text-lg font-bold">{branch?.name.toUpperCase()}</h2>
                <p className="max-w-[250px]">{branch?.location}</p>
                <p>Telp: {branch?.phone || "-"}</p>
                <p>Email: {branch?.email || "-"}</p>
              </div>
              <div className="text-right">
                <h1 className="text-xl sm:text-2xl font-bold">
                    {documentType === 'invoice' ? 'Faktur Penjualan' : 'Surat Jalan'}
                </h1>
              </div>
            </div>

            {/* Customer Info */}
            <div className="grid grid-cols-2 gap-4 mt-4 text-xs sm:text-sm">
              <div>
                <div className="grid grid-cols-[100px_auto]">
                  <span className="text-gray-600">Nama</span>
                  <span>: {sale.nama_customer}</span>
                </div>
                 <div className="grid grid-cols-[100px_auto]">
                  <span className="text-gray-600">Alamat</span>
                  <span>: {customerAddress}</span>
                </div>
              </div>
               <div className="text-left">
                <div className="grid grid-cols-[100px_auto]">
                  <span className="text-gray-600">Nomor Faktur</span>
                  <span>: {sale.nomor_penjualan}</span>
                </div>
                 <div className="grid grid-cols-[100px_auto]">
                  <span className="text-gray-600">Tanggal Faktur</span>
                  <span>: {format(new Date(sale.tanggal_penjualan), 'dd MMMM yyyy', { locale: id })}</span>
                </div>
                 {documentType === 'suratJalan' && vehicleNumber && (
                    <div className="grid grid-cols-[100px_auto]">
                        <span className="text-gray-600">No. Kendaraan</span>
                        <span>: {vehicleNumber}</span>
                    </div>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div className="mt-6">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-gray-100">
                  <tr className="border-y border-gray-300">
                    <th className="p-2 text-left font-semibold">#</th>
                    <th className="p-2 text-left font-semibold">Kode Produk</th>
                    <th className="p-2 text-left font-semibold">Nama Produk</th>
                    <th className="p-2 text-center font-semibold">Satuan</th>
                    {documentType === 'invoice' && <th className="p-2 text-right font-semibold">Harga</th>}
                    <th className="p-2 text-center font-semibold">Qty</th>
                    {documentType === 'invoice' && <th className="p-2 text-right font-semibold">Diskon</th>}
                    {documentType === 'invoice' && <th className="p-2 text-right font-semibold">Total</th>}
                  </tr>
                </thead>
                <tbody>
                  {sale.items.map((item, index) => (
                    <tr key={item.id} className="border-b border-gray-200">
                      <td className="p-2">{index + 1}</td>
                      <td className="p-2">{item.kode_produk}</td>
                      <td className="p-2">{item.nama_produk}</td>
                      <td className="p-2 text-center">{item.nama_satuan}</td>
                       {documentType === 'invoice' && <td className="p-2 text-right">Rp {item.harga_jual_satuan.toLocaleString('id-ID')}</td>}
                       <td className="p-2 text-center">{item.jumlah}</td>
                       {documentType === 'invoice' && <td className="p-2 text-right">Rp {(item.subtotal * (item.diskon / 100)).toLocaleString('id-ID')}</td>}
                       {documentType === 'invoice' && <td className="p-2 text-right">Rp {item.subtotal.toLocaleString('id-ID')}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="flex justify-between mt-4 text-xs sm:text-sm">
                {/* Signature */}
                <div className="w-1/2">
                    <p>Hormat Kami,</p>
                    <div className="h-20"></div>
                    <p className="font-semibold border-t border-gray-400 pt-1 inline-block">{documentType === 'suratJalan' ? userProfile?.name : 'Admin Penjualan'}</p>
                </div>

                {/* Totals */}
                {documentType === 'invoice' && (
                    <div className="w-1/2 max-w-xs space-y-1">
                        <div className="flex justify-between">
                            <span>Sub Total</span>
                            <span className="text-right">Rp {subtotal.toLocaleString('id-ID')}</span>
                        </div>
                         <div className="flex justify-between">
                            <span>Diskon</span>
                            <span className="text-right">(Rp {totalDiscount.toLocaleString('id-ID')})</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Pajak (PPN {sale.pajak}%)</span>
                            <span className="text-right">Rp {taxAmount.toLocaleString('id-ID')}</span>
                        </div>
                         <div className="flex justify-between">
                            <span>Ongkos Kirim</span>
                            <span className="text-right">Rp {ongkosKirim.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between font-bold text-base border-t border-gray-400 pt-1 mt-1">
                            <span>Grand Total</span>
                            <span className="text-right">Rp {sale.total_harga.toLocaleString('id-ID')}</span>
                        </div>
                    </div>
                )}
            </div>

             {/* Notes */}
            <div className="mt-6 pt-4 border-t text-xs">
                <p className="font-semibold">Note:</p>
                <p>{branch?.invoiceNotes || "Harga sudah Termasuk PPN."}</p>
            </div>

          </div>
        </div>
      </div>
      <SuratJalanModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSuratJalanSubmit}
      />
      <style jsx global>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            background-color: #ffffff !important;
          }
          .print\:hidden { display: none; }
          .print\:p-0 { padding: 0; }
          .print\:border-none { border: none !important; }
          .print\:shadow-none { box-shadow: none !important; }
          .text-gray-800 { color: #1f2937 !important; }
          .bg-gray-100 { background-color: #f3f4f6 !important; }
          .border-gray-300 { border-color: #d1d5db !important; }
          .border-gray-200 { border-color: #e5e7eb !important; }
          .border-gray-400 { border-color: #9ca3af !important; }
        }
      `}</style>
    </>
  );
}

    
