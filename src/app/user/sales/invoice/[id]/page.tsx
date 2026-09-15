'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSaleStore } from '@/store/sale-store'
import { useBranchStore } from '@/store/branch-store'
import { useAuthStore } from '@/store/auth-store'
import { Sale, Branch, Customer } from '@/lib/types'
import { Loader2, Printer, FileText, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { SuratJalanModal } from './surat-jalan-modal'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { useCustomerStore } from '@/store/customer-store'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

type DocumentType = 'invoice' | 'suratJalan'
type InvoiceView = 'final' | 'original'

export default function InvoicePage() {
  const params = useParams()
  const router = useRouter()
  const saleId = params.id as string

  const { getSaleById, isFetching: isSaleFetching } = useSaleStore()
  const { getBranchById, isFetching: isBranchFetching } = useBranchStore()
  const { getCustomerById } = useCustomerStore()
  const { userProfile } = useAuthStore()

  const [sale, setSale] = useState<Sale | null>(null)
  const [branch, setBranch] = useState<Branch | null>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [documentType, setDocumentType] = useState<DocumentType>('invoice')
  const [invoiceView, setInvoiceView] = useState<InvoiceView>('final')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [vehicleNumber, setVehicleNumber] = useState('')
  const [isPrinting, setIsPrinting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const printAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchData() {
      if (saleId) {
        const saleData = await getSaleById(saleId)
        if (saleData) {
          setSale(saleData)
          if (userProfile?.branchId) {
            const branchData = getBranchById(userProfile.branchId)
            setBranch(branchData || null)
          }
          if (saleData.customer_id) {
            const customerData = await getCustomerById(saleData.customer_id)
            setCustomer(customerData || null)
          }
        } else {
          router.push('/user/sales')
        }
      }
    }
    fetchData()
  }, [saleId, getSaleById, getBranchById, userProfile, router, getCustomerById])

  const handlePrint = () => {
    setIsPrinting(true)
    setTimeout(() => {
      window.print()
      setIsPrinting(false)
    }, 100)
  }

  const handleDownloadPdf = async (type: DocumentType) => {
    if (!printAreaRef.current) return
    setIsDownloading(true)
    const prevView = invoiceView
    // PDF faktur selalu memakai tampilan yang sedang aktif (Akhir/Awal).
    // Untuk surat jalan, paksa qty asli agar dokumen jalan tidak terpotong retur.
    if (type === 'suratJalan' && invoiceView !== 'original') {
      setInvoiceView('original')
      await new Promise((resolve) => setTimeout(resolve, 80))
    }
    setDocumentType(type) // Set document type before rendering for PDF

    // Allow state to update and re-render
    await new Promise((resolve) => setTimeout(resolve, 50))

    const canvas = await html2canvas(printAreaRef.current, { scale: 2 })
    const imgData = canvas.toDataURL('image/jpeg', 0.8)

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: 'a4',
    })

    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = canvas.width
    const imgHeight = canvas.height
    const ratio = imgWidth / imgHeight

    let widthInPdf = pdfWidth
    let heightInPdf = widthInPdf / ratio

    if (heightInPdf > pdfHeight) {
      heightInPdf = pdfHeight
      widthInPdf = heightInPdf * ratio
    }

    const x = (pdfWidth - widthInPdf) / 2
    const y = 0

    pdf.addImage(imgData, 'JPEG', x, y, widthInPdf, heightInPdf)
    const viewSuffix =
      type === 'invoice' ? (invoiceView === 'final' && hasReturn ? '-akhir' : '-awal') : ''
    pdf.save(`${type}${viewSuffix}-${sale?.nomor_penjualan}.pdf`)

    if (type === 'suratJalan' && invoiceView !== prevView) {
      setInvoiceView(prevView)
    }
    setIsDownloading(false)
  }

  const handleSuratJalanClick = () => {
    setIsModalOpen(true)
  }

  const handleSuratJalanSubmit = (vehicle: string) => {
    setVehicleNumber(vehicle)
    setIsModalOpen(false)
    handleDownloadPdf('suratJalan')
  }

  const isLoading = isSaleFetching || isBranchFetching || !sale || !branch

  if (isLoading) {
    return (
      <div className='flex h-screen items-center justify-center bg-background'>
        <Loader2 className='h-10 w-10 animate-spin' />
      </div>
    )
  }

  const invoiceDiscount = sale.diskon_invoice || 0

  const ongkosKirim = sale.ongkos_kirim || 0
  const totalRetur = sale.total_retur || 0
  const netTotal = sale.total_harga - totalRetur
  const hasReturn = totalRetur > 1e-9
  const EPS_QTY = 1e-9
  const netQtyOf = (jumlah: number, diretur?: number) =>
    Math.max(0, Math.round((jumlah - (diretur || 0)) * 1000) / 1000)
  const netSubtotalOf = (jumlah: number, diretur: number | undefined, harga: number) =>
    Math.round(netQtyOf(jumlah, diretur) * harga * 100) / 100
  const netDiscountOf = (netSubtotal: number, diskon: number) =>
    Math.round(netSubtotal * (diskon / 100) * 100) / 100
  const finalItems = (sale.items || [])
    .map((item) => {
      const netQty = netQtyOf(item.jumlah, item.jumlah_diretur)
      const netSubtotal = netSubtotalOf(item.jumlah, item.jumlah_diretur, item.harga_jual_satuan)
      return { item, netQty, netSubtotal, netDiscount: netDiscountOf(netSubtotal, item.diskon || 0) }
    })
    .filter((row) => row.netQty > EPS_QTY)
  const shownItems =
    invoiceView === 'final' && hasReturn
      ? finalItems.map((row, index) => ({
          key: String(row.item.id ?? index),
          kode_produk: row.item.kode_produk,
          nama_produk: row.item.nama_produk,
          nama_satuan: row.item.nama_satuan,
          harga_jual_satuan: row.item.harga_jual_satuan,
          diskon: row.item.diskon,
          jumlah: row.netQty,
          subtotal: row.netSubtotal,
          discountAmount: row.netDiscount,
        }))
      : (sale.items || []).map((item, index) => ({
          key: String(item.id ?? index),
          kode_produk: item.kode_produk,
          nama_produk: item.nama_produk,
          nama_satuan: item.nama_satuan,
          harga_jual_satuan: item.harga_jual_satuan,
          diskon: item.diskon,
          jumlah: item.jumlah,
          subtotal: item.subtotal,
          discountAmount: item.subtotal * ((item.diskon || 0) / 100),
        }))
  const viewSubtotal = shownItems.reduce((acc, row) => acc + row.subtotal, 0)
  const viewItemDiscount = shownItems.reduce((acc, row) => acc + row.discountAmount, 0)
  const viewInvoiceDiscount =
    invoiceView === 'final' && hasReturn ? 0 : invoiceDiscount
  const viewDppBeforeTax = viewSubtotal - viewItemDiscount - viewInvoiceDiscount
  let viewDpp = viewDppBeforeTax
  let viewTaxAmount = 0
  if (sale.taxType === 'inclusive') {
    viewTaxAmount =
      viewDppBeforeTax - viewDppBeforeTax / (1 + (sale.pajak || 0) / 100)
    viewDpp = viewDppBeforeTax - viewTaxAmount
  } else {
    viewTaxAmount = viewDppBeforeTax * ((sale.pajak || 0) / 100)
  }
  const viewGrandTotal = viewDpp + viewTaxAmount + ongkosKirim

  return (
    <>
      <div className='bg-background min-h-screen'>
        <div className='max-w-4xl mx-auto p-4 sm:p-8 print:p-0'>
          <div className='flex flex-wrap justify-between items-center gap-3 mb-6 print:hidden'>
            <div className='flex items-center gap-3'>
              <h1 className='text-2xl font-bold'>Dokumen Penjualan</h1>
              {documentType === 'invoice' && hasReturn && (
                <Tabs
                  value={invoiceView}
                  onValueChange={(v) => setInvoiceView(v as InvoiceView)}
                >
                  <TabsList>
                    <TabsTrigger value='final'>Faktur Akhir</TabsTrigger>
                    <TabsTrigger value='original'>Faktur Awal</TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
            </div>
            <div className='flex gap-2'>
              <Button
                onClick={() => handleDownloadPdf('invoice')}
                variant='outline'
                disabled={isDownloading}
              >
                {isDownloading && documentType === 'invoice' ? (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                ) : (
                  <Download className='mr-2 h-4 w-4' />
                )}
                Download PDF Faktur
              </Button>
              <Button onClick={handleSuratJalanClick} disabled={isDownloading}>
                {isDownloading && documentType === 'suratJalan' ? (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                ) : (
                  <FileText className='mr-2 h-4 w-4' />
                )}
                Buat PDF Surat Jalan
              </Button>
            </div>
          </div>

          <div
            ref={printAreaRef}
            className='bg-card border rounded-lg p-6 print:border-none print:shadow-none print:p-0 text-gray-800 relative'
          >
            {sale.status === 'DRAFT' && documentType === 'invoice' && (
              <div className='absolute inset-0 flex items-center justify-center z-10 pointer-events-none'>
                <div className='text-[8rem] sm:text-[10rem] font-bold text-gray-200/80 -rotate-45 select-none'>
                  DRAFT
                </div>
              </div>
            )}

            {/* Header */}
            <div className='flex justify-between items-start pb-4 border-b'>
              <div className='space-y-1 text-xs sm:text-sm'>
                <h2 className='text-base sm:text-lg font-bold'>
                  {branch?.name.toUpperCase()}
                </h2>
                <p className='max-w-[250px]'>{branch?.location}</p>
                <p>Telp: {branch?.phone || '-'}</p>
                <p>Email: {branch?.email || '-'}</p>
              </div>
              <div className='text-right'>
                <h1 className='text-xl sm:text-2xl font-bold uppercase'>
                  {documentType === 'invoice'
                    ? invoiceView === 'final' && hasReturn
                      ? 'Faktur Penjualan (Akhir)'
                      : 'Faktur Penjualan'
                    : 'Surat Jalan'}
                </h1>
                {documentType === 'invoice' && hasReturn && (
                  <p className='text-[11px] text-gray-500'>
                    {invoiceView === 'final'
                      ? 'Qty sudah dikurangi retur, item 0 disembunyikan'
                      : 'Versi awal sebelum retur (pembanding)'}
                  </p>
                )}
              </div>
            </div>

            {/* Customer Info */}
            <div className='grid grid-cols-2 gap-4 mt-4 text-xs sm:text-sm'>
              <div>
                <div className='grid grid-cols-[100px_auto]'>
                  <span className='text-gray-600'>Nama Pelanggan</span>
                  <span>: {sale.nama_customer}</span>
                </div>
                <div className='grid grid-cols-[100px_auto]'>
                  <span className='text-gray-600'>Alamat</span>
                  <span>: {customer?.alamat || 'N/A'}</span>
                </div>
              </div>
              <div className='text-left'>
                <div className='grid grid-cols-[100px_auto]'>
                  <span className='text-gray-600'>Nomor Faktur</span>
                  <span>: {sale.nomor_penjualan}</span>
                </div>
                <div className='grid grid-cols-[100px_auto]'>
                  <span className='text-gray-600'>Tanggal Faktur</span>
                  <span>
                    :{' '}
                    {format(new Date(sale.tanggal_penjualan), 'dd MMMM yyyy', {
                      locale: id,
                    })}
                  </span>
                </div>
                {documentType === 'suratJalan' && (
                  <>
                    <div className='grid grid-cols-[100px_auto]'>
                      <span className='text-gray-600'>No Surat Jalan</span>
                      <span>: {sale.nomor_penjualan}</span>
                    </div>
                    <div className='grid grid-cols-[100px_auto]'>
                      <span className='text-gray-600'>No Polisi</span>
                      <span>: {vehicleNumber || '...'}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div className='mt-6'>
              <table className='w-full text-xs sm:text-sm'>
                <thead className='bg-gray-100'>
                  <tr className='border-y border-gray-300'>
                    {documentType === 'invoice' ? (
                      <>
                        <th className='p-2 text-left font-semibold'>#</th>
                        <th className='p-2 text-left font-semibold'>
                          Kode Produk
                        </th>
                        <th className='p-2 text-left font-semibold'>
                          Nama Produk
                        </th>
                        <th className='p-2 text-center font-semibold'>
                          Satuan
                        </th>
                        <th className='p-2 text-right font-semibold'>Harga</th>
                        <th className='p-2 text-center font-semibold'>Qty</th>
                        <th className='p-2 text-right font-semibold'>Diskon</th>
                        <th className='p-2 text-right font-semibold'>Total</th>
                      </>
                    ) : (
                      <>
                        <th className='p-2 text-left font-semibold'>Jumlah</th>
                        <th className='p-2 text-left font-semibold'>Satuan</th>
                        <th className='p-2 text-left font-semibold'>
                          Nama Produk
                        </th>
                        <th className='p-2 text-left font-semibold w-[30%]'>
                          Keterangan
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {(documentType === 'invoice' ? shownItems : sale.items).map(
                    (row: any, index: number) => (
                      <tr key={row.key ?? row.id ?? index} className='border-b border-gray-200'>
                        {documentType === 'invoice' ? (
                          <>
                            <td className='p-2'>{index + 1}</td>
                            <td className='p-2'>{row.kode_produk}</td>
                            <td className='p-2'>{row.nama_produk}</td>
                            <td className='p-2 text-center'>
                              {row.nama_satuan}
                            </td>
                            <td className='p-2 text-right'>
                              Rp {row.harga_jual_satuan.toLocaleString('id-ID')}
                            </td>
                            <td className='p-2 text-center'>{row.jumlah}</td>
                            <td className='p-2 text-right'>
                              Rp{' '}
                              {(row.discountAmount ?? 0).toLocaleString('id-ID')}
                            </td>
                            <td className='p-2 text-right'>
                              Rp {row.subtotal.toLocaleString('id-ID')}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className='p-2'>{row.jumlah}</td>
                            <td className='p-2'>{row.nama_satuan}</td>
                            <td className='p-2'>{row.nama_produk}</td>
                            <td className='p-2'></td>
                          </>
                        )}
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            {documentType === 'invoice' ? (
              <div className='flex justify-between mt-4 text-xs sm:text-sm'>
                <div className='w-1/2'>
                  <p>Hormat Kami,</p>
                  <div className='h-20'></div>
                  <p className='font-semibold border-t border-gray-400 pt-1 inline-block'>
                    Admin Penjualan
                  </p>
                </div>
                <div className='w-1/2 max-w-xs space-y-1'>
                  <div className='flex justify-between'>
                    <span>Sub Total:</span>
                    <span className='text-right'>
                      Rp {viewSubtotal.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Diskon:</span>
                    <span className='text-right'>
                      (Rp {(viewItemDiscount + viewInvoiceDiscount).toLocaleString('id-ID')})
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Pajak (PPN {sale.pajak}%):</span>
                    <span className='text-right'>
                      Rp {viewTaxAmount.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Ongkos Kirim:</span>
                    <span className='text-right'>
                      Rp {ongkosKirim.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className='flex justify-between font-bold text-base border-t border-gray-400 pt-1 mt-1'>
                    <span>Grand Total:</span>
                    <span className='text-right'>
                      Rp {viewGrandTotal.toLocaleString('id-ID')}
                    </span>
                  </div>
                  {invoiceView === 'original' && hasReturn && (
                    <>
                      <div className='flex justify-between text-red-600'>
                        <span>Total Retur:</span>
                        <span className='text-right'>
                          (Rp {totalRetur.toLocaleString('id-ID')})
                        </span>
                      </div>
                      <div className='flex justify-between font-bold'>
                        <span>Net Setelah Retur:</span>
                        <span className='text-right'>
                          Rp {netTotal.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className='mt-8 grid grid-cols-3 gap-4 text-center text-xs sm:text-sm'>
                <div>
                  <p>Supir</p>
                  <div className='h-20'></div>
                  <p>( . . . . . . . . . . . . . . . )</p>
                </div>
                <div>
                  <p>Gudang</p>
                  <div className='h-20'></div>
                  <p>( . . . . . . . . . . . . . . . )</p>
                </div>
                <div>
                  <p>Diterima Oleh</p>
                  <div className='h-20'></div>
                  <p>( . . . . . . . . . . . . . . . )</p>
                </div>
              </div>
            )}

            {/* Notes */}
            {documentType === 'invoice' && (
              <div className='mt-6 pt-4 border-t text-xs'>
                <p className='font-semibold'>Note:</p>
                <p>{branch?.invoiceNotes || 'Harga sudah Termasuk PPN.'}</p>
              </div>
            )}
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
          .print\:hidden {
            display: none;
          }
          .print\:p-0 {
            padding: 0;
          }
          .print\:border-none {
            border: none !important;
          }
          .print\:shadow-none {
            box-shadow: none !important;
          }
          .text-gray-800 {
            color: #1f2937 !important;
          }
          .bg-gray-100 {
            background-color: #f3f4f6 !important;
          }
          .border-gray-300 {
            border-color: #d1d5db !important;
          }
          .border-gray-200 {
            border-color: #e5e7eb !important;
          }
          .border-gray-400 {
            border-color: #9ca3af !important;
          }
        }
      `}</style>
    </>
  )
}
