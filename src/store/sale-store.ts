'use client'
import { create } from 'zustand'
import {
  Sale,
  PaginatedResponse,
  SaleItem,
  SaleReturnLine,
  SaleStatus,
  SaleStatusHistory,
} from '@/lib/types'
import { toast } from '@/hooks/use-toast'
import { useProductStore } from './product-store'
import { useStockStore } from './stock-store'
import {
  collection,
  query,
  getDocs,
  addDoc,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { useAuthStore } from './auth-store'
import { useFirebaseStore } from './firebase-store'
import {
  addDocumentNonBlocking,
  deleteDocumentNonBlocking,
  setDocumentNonBlocking,
} from '@/firebase'
import { useCustomerStore } from './customer-store'

type SortBy = 'tanggal_penjualan' | 'total_harga' | 'status'
type SortDirection = 'asc' | 'desc'

type SaleState = {
  sales: Sale[]
  total: number
  page: number
  limit: number
  searchTerm: string
  sortBy: SortBy
  sortDirection: SortDirection
  isFetching: boolean
  isSubmitting: boolean
  isDeleting: boolean
  setPage: (page: number) => void
  setLimit: (limit: number) => void
  setSearchTerm: (searchTerm: string) => void
  setSort: (sortBy: SortBy, sortDirection: SortDirection) => void
  fetchSales: () => Promise<void>
  getSaleById: (saleId: string) => Promise<Sale | undefined>
  addSale: (
    sale: Omit<
      Sale,
      | 'id'
      | 'nomor_penjualan'
      | 'created_at'
      | 'status'
      | 'branchId'
      | 'history'
    > & { items: SaleItem[] },
  ) => Promise<Sale | undefined>
  editSale: (sale: Sale) => Promise<void>
  deleteSale: (saleId: string) => Promise<void>
  deleteAllSales: () => Promise<void>
  updateSaleStatus: (
    saleId: string,
    status: SaleStatus,
    note?: string,
  ) => Promise<void>
  processSaleReturn: (
    saleId: string,
    lines: SaleReturnLine[],
    note: string,
  ) => Promise<{
    success: boolean
    refundTotal: number
    isFullyReturned: boolean
  }>
}

export const useSaleStore = create<SaleState>((set, get) => ({
  sales: [],
  total: 0,
  page: 1,
  limit: 10,
  searchTerm: '',
  sortBy: 'tanggal_penjualan',
  sortDirection: 'desc',
  isFetching: false,
  isSubmitting: false,
  isDeleting: false,

  setPage: (page) => set({ page, sales: [] }),
  setLimit: (limit) => set({ limit, page: 1, sales: [] }),
  setSearchTerm: (searchTerm) => set({ searchTerm, page: 1, sales: [] }),
  setSort: (sortBy, sortDirection) => set({ sortBy, sortDirection, page: 1 }),

  fetchSales: async () => {
    const { firestore } = useFirebaseStore.getState()
    const { branchId } = useAuthStore.getState()
    if (!firestore || !branchId) return

    const { page, limit, searchTerm, sortBy, sortDirection } = get()
    set({ isFetching: true })

    try {
      const customersRef = collection(firestore, 'customers')
      const customerQuery = query(
        customersRef,
        where('branchId', '==', branchId),
      )
      const customersSnapshot = await getDocs(customerQuery)
      const customersMap = new Map(
        customersSnapshot.docs.map((doc) => [doc.id, doc.data().nama_customer]),
      )

      const salesRef = collection(firestore, 'sales')
      const q = query(salesRef, where('branchId', '==', branchId))
      const querySnapshot = await getDocs(q)

      let salesData: Sale[] = querySnapshot.docs.map((doc) => {
        const data = doc.data() as Sale
        return {
          id: doc.id,
          ...data,
          nama_customer: customersMap.get(data.customer_id) || 'N/A',
        }
      })

      if (searchTerm) {
        const lowercasedFilter = searchTerm.toLowerCase()
        salesData = salesData.filter(
          (s) =>
            s.nomor_penjualan.toLowerCase().includes(lowercasedFilter) ||
            s.nama_customer?.toLowerCase().includes(lowercasedFilter),
        )
      }

      salesData.sort((a, b) => {
        const valA = a[sortBy]
        const valB = b[sortBy]

        let comparison = 0
        if (valA > valB) {
          comparison = 1
        } else if (valA < valB) {
          comparison = -1
        }
        return sortDirection === 'desc' ? comparison * -1 : comparison
      })

      const total = salesData.length
      const paginatedSales = salesData.slice((page - 1) * limit, page * limit)

      set({ sales: paginatedSales, total, isFetching: false })
    } catch (error) {
      console.error('Failed to fetch sales:', error)
      toast({
        variant: 'destructive',
        title: 'Gagal Mengambil Data',
        description: 'Terjadi kesalahan saat mengambil data penjualan.',
      })
      set({ isFetching: false })
    }
  },

  getSaleById: async (saleId: string) => {
    const { firestore } = useFirebaseStore.getState()
    const { branchId } = useAuthStore.getState()
    if (!firestore || !branchId) return undefined

    set({ isFetching: true })
    try {
      const saleRef = doc(firestore, 'sales', saleId)
      const docSnap = await getDoc(saleRef)
      if (docSnap.exists() && docSnap.data().branchId === branchId) {
        const saleData = { id: docSnap.id, ...docSnap.data() } as Sale
        if (saleData.customer_id && !saleData.nama_customer) {
          const customerRef = doc(firestore, 'customers', saleData.customer_id)
          const customerSnap = await getDoc(customerRef)
          if (customerSnap.exists()) {
            saleData.nama_customer = customerSnap.data().nama_customer
          }
        }
        return saleData
      }
      return undefined
    } catch (error) {
      console.error('Failed to fetch sale:', error)
      return undefined
    } finally {
      set({ isFetching: false })
    }
  },

  addSale: async (sale) => {
    const { firestore } = useFirebaseStore.getState()
    const { branchId, user } = useAuthStore.getState()
    if (!firestore || !branchId || !user) return

    set({ isSubmitting: true })
    try {
      const salesRef = collection(firestore, 'sales')
      const soNumber = `SO-${Date.now()}`

      const newSaleData: Omit<Sale, 'id'> = {
        ...sale,
        items: (sale.items || []).map((item) => ({
          ...item,
          jumlah_diretur: 0,
        })),
        total_retur: 0,
        branchId,
        nomor_penjualan: soNumber,
        status: 'DRAFT',
        created_at: new Date().toISOString(),
        history: [
          {
            status: 'DRAFT',
            tanggal: new Date().toISOString(),
            oleh: user.displayName || 'System',
          },
        ],
      }

      const docRef = await addDoc(salesRef, newSaleData)

      toast({
        title: 'Draft Penjualan Disimpan',
        description:
          'Transaksi penjualan telah berhasil disimpan sebagai draft.',
      })

      get().fetchSales()

      return { id: docRef.id, ...newSaleData }
    } catch (error) {
      console.error('Failed to add sale:', error)
      toast({
        variant: 'destructive',
        title: 'Gagal Menyimpan',
        description: 'Terjadi kesalahan saat menyimpan penjualan.',
      })
    } finally {
      set({ isSubmitting: false })
    }
  },

  editSale: async (updatedSale) => {
    const { firestore } = useFirebaseStore.getState()
    if (!firestore) return

    set({ isSubmitting: true })
    const saleRef = doc(firestore, 'sales', updatedSale.id)
    const { nama_customer, ...saleToSave } = updatedSale
    try {
      await setDoc(saleRef, saleToSave, { merge: true })
      toast({
        title: 'Penjualan Diperbarui',
        description: 'Perubahan pada penjualan telah berhasil disimpan.',
      })
      set((state) => ({
        sales: state.sales.map((s) =>
          s.id === updatedSale.id ? updatedSale : s,
        ),
      }))
    } catch (error) {
      console.error('Failed to edit sale:', error)
    } finally {
      set({ isSubmitting: false })
    }
  },

  deleteSale: async (saleId: string) => {
    const { firestore } = useFirebaseStore.getState()
    if (!firestore) return

    set({ isDeleting: true })
    const saleRef = doc(firestore, 'sales', saleId)
    deleteDocumentNonBlocking(saleRef)
      .then(() => {
        toast({
          title: 'Penjualan Dihapus',
          description: 'Transaksi penjualan telah berhasil dihapus.',
        })
        get().fetchSales()
      })
      .catch((err) => {
        console.error('Failed to delete sale:', err)
        toast({
          variant: 'destructive',
          title: 'Gagal Menghapus',
          description: 'Terjadi kesalahan saat menghapus penjualan.',
        })
      })
      .finally(() => set({ isDeleting: false }))
  },

  deleteAllSales: async () => {
    const { firestore } = useFirebaseStore.getState()
    const { branchId } = useAuthStore.getState()
    if (!firestore || !branchId) return

    set({ isDeleting: true })
    try {
      const salesRef = collection(firestore, 'sales')
      const q = query(salesRef, where('branchId', '==', branchId))
      const snapshot = await getDocs(q)
      const batch = writeBatch(firestore)
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref)
      })
      await batch.commit()
      get().fetchSales()
    } catch (err) {
      console.error('Failed to delete all sales:', err)
    } finally {
      set({ isDeleting: false })
    }
  },

  updateSaleStatus: async (saleId, status, note) => {
    const { firestore, auth } = useFirebaseStore.getState()
    if (!firestore || !auth?.currentUser) return

    set({ isSubmitting: true })
    const sale = await get().getSaleById(saleId)
    if (!sale) {
      set({ isSubmitting: false })
      return
    }

    const newHistoryEntry: SaleStatusHistory = {
      status: status,
      tanggal: new Date().toISOString(),
      oleh: auth.currentUser.displayName || 'System',
      catatan: note,
    }

    const updatedSale: Sale = {
      ...sale,
      status: status,
      history: [...(sale.history || []), newHistoryEntry],
    }

    if (status === 'DIKIRIM') {
      const { getProductById, editProduct } = useProductStore.getState()
      const { addStockMovement } = useStockStore.getState()
      for (const item of sale.items) {
        const product = await getProductById(item.produk_id)
        if (product) {
          const newStock = product.stok - item.jumlah
          await editProduct({ ...product, stok: newStock }, true)
          await addStockMovement({
            tanggal: new Date().toISOString(),
            produk_id: product.id,
            nama_produk: product.nama_produk,
            nama_satuan: product.nama_satuan || 'N/A',
            tipe: 'Penjualan Keluar',
            jumlah: -item.jumlah,
            stok_akhir: newStock,
            referensi: sale.nomor_penjualan,
          })
        }
      }
    }

    if (status === 'DIRETUR') {
      // Legacy full-invoice return path (kept for backward compatibility).
      // New per-item flow uses processSaleReturn() below.
      const { getProductById, editProduct } = useProductStore.getState()
      const { addStockMovement } = useStockStore.getState()
      for (const item of sale.items) {
        const alreadyReturned = item.jumlah_diretur || 0
        const remaining = item.jumlah - alreadyReturned
        if (remaining <= 0) continue
        const product = await getProductById(item.produk_id)
        if (product) {
          const newStock = product.stok + remaining
          await editProduct({ ...product, stok: newStock }, true)
          await addStockMovement({
            tanggal: new Date().toISOString(),
            produk_id: product.id,
            nama_produk: product.nama_produk,
            nama_satuan: product.nama_satuan || 'N/A',
            tipe: 'Retur Penjualan',
            jumlah: remaining,
            stok_akhir: newStock,
            referensi: sale.nomor_penjualan,
          })
        }
      }
      updatedSale.items = (sale.items || []).map((item) => ({
        ...item,
        jumlah_diretur: item.jumlah,
      }))
      toast({
        title: 'Retur Diproses',
        description: 'Stok telah dikembalikan ke persediaan.',
      })
    }

    await get().editSale(updatedSale)
    set({ isSubmitting: false })
  },

  processSaleReturn: async (saleId, lines, note) => {
    const { firestore, auth } = useFirebaseStore.getState()
    const { userProfile, user } = useAuthStore.getState()
    if (!firestore || !auth?.currentUser) {
      toast({
        variant: 'destructive',
        title: 'Gagal',
        description: 'Sesi tidak valid. Silakan login ulang.',
      })
      return { success: false, refundTotal: 0, isFullyReturned: false }
    }

    if (!note || !note.trim()) {
      toast({
        variant: 'destructive',
        title: 'Alasan Wajib',
        description: 'Alasan retur wajib diisi.',
      })
      return { success: false, refundTotal: 0, isFullyReturned: false }
    }

    const activeLines = (lines || []).filter((l) => l.jumlah_retur > 0)
    if (activeLines.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Gagal',
        description: 'Minimal 1 barang dengan qty retur > 0.',
      })
      return { success: false, refundTotal: 0, isFullyReturned: false }
    }

    set({ isSubmitting: true })
    try {
      // Re-fetch fresh sale to prevent double-return / stale sisa qty.
      const sale = await get().getSaleById(saleId)
      if (!sale) {
        toast({
          variant: 'destructive',
          title: 'Gagal',
          description: 'Data penjualan tidak ditemukan.',
        })
        return { success: false, refundTotal: 0, isFullyReturned: false }
      }

      if (sale.status === 'DIRETUR' || sale.status === 'DIBATALKAN') {
        toast({
          variant: 'destructive',
          title: 'Gagal',
          description: 'Faktur ini sudah diretur penuh / dibatalkan.',
        })
        return {
          success: false,
          refundTotal: 0,
          isFullyReturned: sale.status === 'DIRETUR',
        }
      }

      if (sale.status !== 'LUNAS') {
        toast({
          variant: 'destructive',
          title: 'Gagal',
          description: 'Retur per item hanya untuk faktur berstatus LUNAS.',
        })
        return { success: false, refundTotal: 0, isFullyReturned: false }
      }

      const { getProductById, editProduct } = useProductStore.getState()
      const { addStockMovement } = useStockStore.getState()
      const actor =
        userProfile?.name ||
        auth.currentUser.displayName ||
        user?.email ||
        'System'
      const nowIso = new Date().toISOString()

      // Validate all lines first (atomic guard: no partial stock mutation on invalid input).
      const validated: { item: SaleItem; qty: number; refund: number }[] = []
      for (const line of activeLines) {
        const item = (sale.items || []).find(
          (i) => String(i.id) === String(line.item_id),
        )
        if (!item) {
          toast({
            variant: 'destructive',
            title: 'Gagal',
            description: 'Item retur tidak cocok dengan faktur.',
          })
          return { success: false, refundTotal: 0, isFullyReturned: false }
        }
        const alreadyReturned = item.jumlah_diretur || 0
        const remaining = item.jumlah - alreadyReturned
        const EPS = 1e-9
        const qty = Math.round(Number(line.jumlah_retur) * 1000) / 1000
        if (
          !Number.isFinite(qty) ||
          qty <= EPS ||
          qty - remaining > EPS
        ) {
          toast({
            variant: 'destructive',
            title: 'Qty Retur Tidak Valid',
            description: `${item.nama_produk}: sisa dapat diretur ${remaining} ${item.nama_satuan}.`,
          })
          return { success: false, refundTotal: 0, isFullyReturned: false }
        }
        const netUnitPrice =
          item.harga_jual_satuan * (1 - (item.diskon || 0) / 100)
        validated.push({
          item,
          qty,
          refund: netUnitPrice * qty,
        })
      }

      // Apply stock mutations per validated line (1 movement per line = clear audit trail).
      let refundTotal = 0
      const returnedDesc: string[] = []
      for (const v of validated) {
        const product = await getProductById(v.item.produk_id)
        if (!product) {
          toast({
            variant: 'destructive',
            title: 'Gagal',
            description: `Produk ${v.item.nama_produk} tidak ditemukan.`,
          })
          return { success: false, refundTotal: 0, isFullyReturned: false }
        }
        const newStock = product.stok + v.qty
        await editProduct({ ...product, stok: newStock }, true)
        await addStockMovement({
          tanggal: nowIso,
          produk_id: product.id,
          nama_produk: product.nama_produk,
          nama_satuan: product.nama_satuan || v.item.nama_satuan || 'N/A',
          tipe: 'Retur Penjualan',
          jumlah: v.qty,
          stok_akhir: newStock,
          referensi: sale.nomor_penjualan,
        })
        refundTotal += v.refund
        returnedDesc.push(`${v.item.nama_produk} x${v.qty}`)
      }

      const updatedItems: SaleItem[] = (sale.items || []).map((item) => {
        const hit = validated.find((v) => String(v.item.id) === String(item.id))
        if (!hit) return { ...item, jumlah_diretur: item.jumlah_diretur || 0 }
        const nextReturned =
          Math.round(((item.jumlah_diretur || 0) + hit.qty) * 1000) / 1000
        return { ...item, jumlah_diretur: nextReturned }
      })

      const EPS_DONE = 1e-9
      const isFullyReturned = updatedItems.every(
        (i) => (i.jumlah_diretur || 0) + EPS_DONE >= i.jumlah,
      )
      const newStatus: SaleStatus = isFullyReturned ? 'DIRETUR' : 'LUNAS'
      const historyStatus: SaleStatus = isFullyReturned ? 'DIRETUR' : 'LUNAS'
      const historyNote = `Retur per item (${returnedDesc.join(', ')}). Refund Rp${Math.round(refundTotal).toLocaleString('id-ID')}. Alasan: ${note.trim()}`

      const updatedSale: Sale = {
        ...sale,
        items: updatedItems,
        total_retur: (sale.total_retur || 0) + refundTotal,
        status: newStatus,
        history: [
          ...(sale.history || []),
          {
            status: historyStatus,
            tanggal: nowIso,
            oleh: actor,
            catatan: historyNote,
          },
        ],
      }

      await get().editSale(updatedSale)
      toast({
        title: isFullyReturned
          ? 'Retur Penuh Selesai'
          : 'Retur Sebagian Diproses',
        description: `Refund Rp${Math.round(refundTotal).toLocaleString('id-ID')}. Stok dikembalikan ke persediaan.`,
      })
      return { success: true, refundTotal, isFullyReturned }
    } catch (error) {
      console.error('Failed to process sale return:', error)
      toast({
        variant: 'destructive',
        title: 'Gagal Memproses Retur',
        description: 'Terjadi kesalahan saat memproses retur.',
      })
      return { success: false, refundTotal: 0, isFullyReturned: false }
    } finally {
      set({ isSubmitting: false })
    }
  },
}))
