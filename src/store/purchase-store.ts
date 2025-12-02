
"use client";
import { create } from 'zustand';
import { Purchase, PaginatedResponse, PurchaseStatus, PurchaseItem, Supplier } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { useProductStore } from './product-store';
import { useStockStore } from './stock-store';
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
} from 'firebase/firestore';
import { useAuthStore } from './auth-store';
import { useFirebaseStore } from './firebase-store';
import {
  addDocumentNonBlocking,
  deleteDocumentNonBlocking,
  setDocumentNonBlocking,
} from '@/firebase';
import { useSupplierStore } from './supplier-store';

type PurchaseState = {
  purchases: Purchase[];
  total: number;
  page: number;
  limit: number;
  searchTerm: string;
  isFetching: boolean;
  isSubmitting: boolean;
  isDeleting: boolean;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setSearchTerm: (searchTerm: string) => void;
  fetchPurchases: () => Promise<void>;
  getPurchaseById: (purchaseId: string) => Promise<Purchase | undefined>;
  addPurchase: (purchase: Omit<Purchase, 'id' | 'nomor_pembelian' | 'created_at' | 'status' | 'branchId'>) => Promise<Purchase | undefined>;
  editPurchase: (purchase: Purchase) => Promise<void>;
  deletePurchase: (purchaseId: string) => Promise<void>;
  updatePurchaseStatus: (purchaseId: string, status: PurchaseStatus, note?: string) => Promise<void>;
  receiveItems: (purchaseId: string, receivedItems: PurchaseItem[]) => Promise<void>;
  finalizePurchase: (purchaseId: string) => Promise<void>;
};

export const usePurchaseStore = create<PurchaseState>((set, get) => ({
  purchases: [],
  total: 0,
  page: 1,
  limit: 10,
  searchTerm: '',
  isFetching: false,
  isSubmitting: false,
  isDeleting: false,

  setPage: (page) => set({ page, purchases: [] }),
  setLimit: (limit) => set({ limit, page: 1, purchases: [] }),
  setSearchTerm: (searchTerm) => set({ searchTerm, page: 1, purchases: [] }),

  fetchPurchases: async () => {
    const { firestore } = useFirebaseStore.getState();
    const { branchId } = useAuthStore.getState();
    if (!firestore || !branchId) return;
    
    const { page, limit, searchTerm } = get();
    set({ isFetching: true });
    try {
      const suppliersRef = collection(firestore, 'suppliers');
      const supplierQuery = query(suppliersRef, where("branchId", "==", branchId));
      const suppliersSnapshot = await getDocs(supplierQuery);
      const suppliersMap = new Map(suppliersSnapshot.docs.map(doc => [doc.id, doc.data().nama_supplier]));

      const purchasesRef = collection(firestore, 'purchases');
      const q = query(purchasesRef, where("branchId", "==", branchId));
      const querySnapshot = await getDocs(q);

      let purchases: Purchase[] = querySnapshot.docs.map(doc => {
        const data = doc.data() as Purchase;
        return { 
          id: doc.id, 
          ...data,
          nama_supplier: suppliersMap.get(data.supplier_id) || 'N/A'
        };
      });

       if (searchTerm) {
        const lowercasedFilter = searchTerm.toLowerCase();
        purchases = purchases.filter(p => {
          const matchesPurchaseNumber = p.nomor_pembelian.toLowerCase().includes(lowercasedFilter);
          const matchesSupplier = p.nama_supplier?.toLowerCase().includes(lowercasedFilter);
          const matchesItem = p.items?.some(item => 
            item.nama_produk.toLowerCase().includes(lowercasedFilter)
          );
          return matchesPurchaseNumber || matchesSupplier || matchesItem;
        });
      }
      
      const total = purchases.length;
      const paginatedPurchases = purchases.slice((page - 1) * limit, page * limit);
      
      set({ purchases: paginatedPurchases, total: total, isFetching: false });

    } catch (error) {
      console.error("Failed to fetch purchases:", error);
      set({ isFetching: false });
      toast({ variant: "destructive", title: "Gagal Mengambil Data", description: "Terjadi kesalahan saat mengambil data pembelian." });
    }
  },

  getPurchaseById: async (purchaseId: string) => {
    const { firestore } = useFirebaseStore.getState();
    const { branchId } = useAuthStore.getState();
    if (!firestore || !branchId) return;

    set({ isFetching: true });
    try {
      const purchaseRef = doc(firestore, 'purchases', purchaseId);
      const docSnap = await getDoc(purchaseRef);
      if (docSnap.exists() && docSnap.data().branchId === branchId) {
        const purchaseData = { id: docSnap.id, ...docSnap.data() } as Purchase;
        
        if(purchaseData.supplier_id){
          const supplierRef = doc(firestore, 'suppliers', purchaseData.supplier_id);
          const supplierSnap = await getDoc(supplierRef);
          if(supplierSnap.exists()){
              purchaseData.nama_supplier = supplierSnap.data().nama_supplier;
          }
        }

        return purchaseData;
      }
      return undefined;
    } catch (error) {
      console.error("Failed to fetch purchase:", error);
      toast({ variant: "destructive", title: "Gagal Mengambil Data", description: "Data pembelian tidak ditemukan." });
      return undefined;
    } finally {
      set({ isFetching: false });
    }
  },

  addPurchase: async (purchase) => {
    const { firestore } = useFirebaseStore.getState();
    const { branchId } = useAuthStore.getState();
    if (!firestore || !branchId) return;

    set({ isSubmitting: true });
    try {
      const purchasesRef = collection(firestore, 'purchases');
      const poNumber = `PO-${Date.now()}`;
      const supplierName = useSupplierStore.getState().suppliers.find(s => s.id === purchase.supplier_id)?.nama_supplier || 'N/A';
      
      const newPurchaseData = {
        ...purchase,
        branchId,
        nomor_pembelian: poNumber,
        no_faktur_supplier: purchase.no_faktur_supplier || `PO-${purchase.supplier_id}-${Date.now()}`,
        nama_supplier: supplierName,
        status: 'DRAFT' as PurchaseStatus,
        created_at: new Date().toISOString(),
        history: [{ status: 'DRAFT' as PurchaseStatus, tanggal: new Date().toISOString(), oleh: 'System' }]
      }

      const docRef = await addDoc(purchasesRef, newPurchaseData);
      toast({ title: "Pembelian Ditambahkan", description: "Draft pembelian baru telah berhasil dibuat." });
      
      const purchaseWithSupplierName = { id: docRef.id, ...newPurchaseData };

      set(state => ({
        purchases: [purchaseWithSupplierName, ...state.purchases],
        total: state.total + 1
      }));

      return purchaseWithSupplierName;

    } catch (error) {
      console.error("Failed to add purchase:", error);
      toast({ variant: "destructive", title: "Gagal Menambahkan", description: "Terjadi kesalahan saat menambahkan pembelian." });
    } finally {
      set({ isSubmitting: false });
    }
  },

  editPurchase: async (updatedPurchase) => {
    const { firestore } = useFirebaseStore.getState();
    if (!firestore) return Promise.reject("Firestore not initialized");

    set({ isSubmitting: true });
    const purchaseRef = doc(firestore, 'purchases', updatedPurchase.id);
    const { nama_supplier, ...purchaseToSave } = updatedPurchase;

    try {
        await setDoc(purchaseRef, purchaseToSave, { merge: true });
        toast({ title: "Pembelian Diperbarui", description: "Perubahan pada pembelian telah berhasil disimpan." });
        set(state => ({
            purchases: state.purchases.map(p => p.id === updatedPurchase.id ? updatedPurchase : p)
        }));
    } catch (err) {
        console.error("Failed to edit purchase:", err);
        toast({ variant: "destructive", title: "Gagal Memperbarui", description: "Terjadi kesalahan saat memperbarui pembelian." });
    } finally {
        set({ isSubmitting: false });
    }
  },

  deletePurchase: async (purchaseId: string) => {
    const { firestore } = useFirebaseStore.getState();
    if (!firestore) return;

    set({ isDeleting: true });
    const purchaseRef = doc(firestore, 'purchases', purchaseId);
    try {
        await deleteDoc(purchaseRef);
        toast({ title: "Pembelian Dihapus", description: "Data pembelian telah berhasil dihapus." });
        get().fetchPurchases();
    } catch(err) {
        console.error("Failed to delete purchase:", err);
        toast({ variant: "destructive", title: "Gagal Menghapus", description: "Terjadi kesalahan saat menghapus pembelian." });
    } finally {
        set({ isDeleting: false });
    }
  },
  
  updatePurchaseStatus: async (purchaseId, status, note) => {
    const currentPurchase = get().purchases.find(p => p.id === purchaseId) 
      || await get().getPurchaseById(purchaseId);

    if (!currentPurchase) {
      toast({ variant: "destructive", title: "Gagal", description: "Pembelian tidak ditemukan." });
      return;
    }

    set({ isSubmitting: true });
    const updatedPurchase = { 
      ...currentPurchase, 
      status,
      history: [
          ...(currentPurchase.history || []),
          { status, tanggal: new Date().toISOString(), oleh: 'System', catatan: note }
      ]
    };
    await get().editPurchase(updatedPurchase);
    set({ isSubmitting: false });
  },

  receiveItems: async (purchaseId, receivedItems) => {
    set({ isSubmitting: true });
    const { getProductById, editProduct } = useProductStore.getState();
    const { addStockMovement } = useStockStore.getState();

    const purchase = await get().getPurchaseById(purchaseId);
    if (!purchase) {
      toast({ variant: "destructive", title: "Gagal", description: "Pembelian tidak ditemukan." });
      set({ isSubmitting: false });
      return;
    }

    try {
      let anyItemReceived = false;
      const updatedItemsFromModal = receivedItems;

      for (const receivedItem of updatedItemsFromModal) {
        const originalItem = purchase.items?.find(i => i.id === receivedItem.id);
        if (!originalItem) continue;

        const quantityReceivedNow = receivedItem.jumlah_diterima - originalItem.jumlah_diterima;

        if (quantityReceivedNow > 0) {
          anyItemReceived = true;
          const product = await getProductById(receivedItem.produk_id);
          if (product) {
            const newStock = product.stok + quantityReceivedNow;
            // Ensure product object has nama_satuan before creating stock movement
            const productWithUnit = product.nama_satuan ? product : {...product, nama_satuan: receivedItem.nama_satuan};

            await editProduct({ ...productWithUnit, stok: newStock }, true);
            await addStockMovement({
              tanggal: new Date().toISOString(),
              produk_id: product.id,
              nama_produk: product.nama_produk,
              nama_satuan: productWithUnit.nama_satuan,
              tipe: 'Pembelian Masuk',
              jumlah: quantityReceivedNow,
              stok_akhir: newStock,
              referensi: purchase.nomor_pembelian,
            });
          }
        }
      }
      
      const allItemsFullyReceived = updatedItemsFromModal.every(item => item.jumlah_diterima >= item.jumlah);
      const newStatus = allItemsFullyReceived ? 'DITERIMA_PENUH' : (anyItemReceived ? 'DITERIMA_SEBAGIAN' : purchase.status);

      const updatedPurchaseData: Purchase = {
        ...purchase,
        items: updatedItemsFromModal,
        status: newStatus,
        history: [
          ...(purchase.history || []),
          { status: newStatus, tanggal: new Date().toISOString(), oleh: 'System', catatan: "Penerimaan barang otomatis" }
        ]
      };
      
      await get().editPurchase(updatedPurchaseData);
      toast({ title: "Barang Diterima", description: "Stok telah berhasil diperbarui." });

    } catch (error) {
      console.error("Failed to receive items:", error);
      toast({ variant: "destructive", title: "Gagal Menerima Barang", description: "Terjadi kesalahan." });
    } finally {
      set({ isSubmitting: false });
    }
  },
  
  finalizePurchase: async (purchaseId: string) => {
    await get().updatePurchaseStatus(purchaseId, 'DITERIMA_PENUH', 'Pesanan diselesaikan secara manual oleh pengguna.');
  },
}));

    