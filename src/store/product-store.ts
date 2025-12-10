
import { create } from 'zustand';
import { Product, PaginatedResponse, StockMovement, Category, Unit } from '@/lib/types';
import { useStockStore } from './stock-store';
import { collection, query, where, getDocs, addDoc, doc, setDoc, deleteDoc, getDoc, or, and, writeBatch } from 'firebase/firestore';
import { useAuthStore } from './auth-store';
import { useFirebaseStore } from './firebase-store';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { useCategoryStore } from './category-store';
import { useUnitStore } from './unit-store';
import { toast } from '@/hooks/use-toast';


type ParsedProduct = {
  nama_produk: string;
  kode_produk: string;
  nama_kategori: string;
  nama_satuan: string;
  stok: number;
  harga_modal: number;
  harga_jual: number;
};

type ProductState = {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  searchTerm: string;
  filterCategoryId: string;
  isFetching: boolean;
  isSubmitting: boolean;
  isDeleting: boolean;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setSearchTerm: (searchTerm: string) => void;
  setFilterCategoryId: (categoryId: string) => void;
  resetFilters: () => void;
  fetchProducts: (options?: { all?: boolean }) => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'branchId'>) => Promise<void>;
  editProduct: (product: Product, isStockUpdate?: boolean) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  deleteAllProducts: () => Promise<void>;
  getProductById: (productId: string) => Promise<Product | undefined>;
  importProducts: (products: ParsedProduct[]) => Promise<void>;
  resetAllStock: () => Promise<void>;
  reconcileUnitData: () => Promise<{ count: number; products: Product[] }>;
};

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  total: 0,
  page: 1,
  limit: 10,
  searchTerm: '',
  filterCategoryId: '',
  isFetching: false,
  isSubmitting: false,
  isDeleting: false,
  setPage: (page) => set({ page }),
  setLimit: (limit) => set({ limit, page: 1 }),
  setSearchTerm: (searchTerm) => set({ searchTerm, page: 1 }),
  setFilterCategoryId: (categoryId) => set({ filterCategoryId: categoryId, page: 1 }),
  resetFilters: () => set({ searchTerm: '', filterCategoryId: '', page: 1 }),
  
  fetchProducts: async (options = { all: false }) => {
    const { firestore } = useFirebaseStore.getState();
    const { branchId } = useAuthStore.getState();
    if (!firestore || !branchId) return;

    const { searchTerm, filterCategoryId, page, limit } = get();
    set({ isFetching: true });

    try {
      const categoriesRef = collection(firestore, 'categories');
      const unitsRef = collection(firestore, 'units');
      const catQuery = query(categoriesRef, where("branchId", "==", branchId));
      const unitQuery = query(unitsRef, where("branchId", "==", branchId));
      
      const [categoriesSnapshot, unitsSnapshot] = await Promise.all([
        getDocs(catQuery),
        getDocs(unitQuery)
      ]);

      const categoriesMap = new Map(categoriesSnapshot.docs.map(doc => [doc.id, doc.data().nama_kategori]));
      const unitsMap = new Map(unitsSnapshot.docs.map(doc => [doc.id, doc.data().nama_satuan]));
      
      const productsRef = collection(firestore, 'products');
      const queryConstraints = [where("branchId", "==", branchId)];

      if (filterCategoryId) {
        queryConstraints.push(where("kategori_id", "==", filterCategoryId));
      }
      
      if (searchTerm) {
          // Firestore doesn't support case-insensitive search natively.
      }


      const q = query(productsRef, ...queryConstraints);
      const querySnapshot = await getDocs(q);
      
      let productsData: Product[] = querySnapshot.docs.map(doc => {
          const data = doc.data() as Product;
          return { 
              ...data, 
              id: doc.id,
              nama_kategori: categoriesMap.get(data.kategori_id) || 'N/A',
              nama_satuan: unitsMap.get(data.satuan_id) || 'N/A',
          }
      });

       if (searchTerm) {
        const lowercasedSearchTerm = searchTerm.toLowerCase();
        productsData = productsData.filter(p => 
          p.nama_produk.toLowerCase().includes(lowercasedSearchTerm) ||
          p.kode_produk.toLowerCase().includes(lowercasedSearchTerm)
        );
      }
      
      const total = productsData.length;
      const paginatedProducts = options.all ? productsData : productsData.slice((page - 1) * limit, page * limit);

      set({ 
        products: paginatedProducts,
        total: total,
        isFetching: false 
      });
    } catch (error) {
      console.error("Failed to fetch products:", error);
      set({ isFetching: false });
    }
  },

  addProduct: async (product) => {
    const { firestore } = useFirebaseStore.getState();
    const { branchId } = useAuthStore.getState();
    if (!firestore || !branchId) return;

    set({ isSubmitting: true });
    const productsRef = collection(firestore, `products`);
    const newProductData = { ...product, branchId, status: 'Tersedia' as const };
    addDocumentNonBlocking(productsRef, newProductData)
        .then(() => get().fetchProducts())
        .catch(err => console.error("Failed to add product", err))
        .finally(() => set({ isSubmitting: false }));
  },

  editProduct: async (updatedProduct, isStockUpdate = false) => {
    const { firestore } = useFirebaseStore.getState();
    if (!firestore) return Promise.reject("Firestore not initialized");

    if (!isStockUpdate) {
        set({ isSubmitting: true });
    }
    const productRef = doc(firestore, `products`, updatedProduct.id);
    
    setDocumentNonBlocking(productRef, updatedProduct, { merge: true });

    set((state) => ({
        products: state.products.map((p) =>
        p.id === updatedProduct.id ? { ...p, ...updatedProduct } : p
        ),
    }));

    if (!isStockUpdate) {
        await get().fetchProducts();
        set({ isSubmitting: false });
    }
  },

  deleteProduct: async (productId: string) => {
    const { firestore } = useFirebaseStore.getState();
    if (!firestore) return;
    
    set({ isDeleting: true });
    const productRef = doc(firestore, `products`, productId);
    deleteDocumentNonBlocking(productRef)
      .then(() => get().fetchProducts())
      .catch(err => console.error("Failed to delete product", err))
      .finally(() => set({ isDeleting: false }));
  },
  
  deleteAllProducts: async () => {
    const { firestore } = useFirebaseStore.getState();
    const { branchId } = useAuthStore.getState();
    if (!firestore || !branchId) return;
    
    set({ isDeleting: true });
    try {
        const productsRef = collection(firestore, 'products');
        const q = query(productsRef, where("branchId", "==", branchId));
        const snapshot = await getDocs(q);
        const batch = writeBatch(firestore);
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        get().fetchProducts(); // Refresh the now-empty list
    } catch(err) {
        console.error("Failed to delete all products:", err);
    } finally {
        set({ isDeleting: false });
    }
  },

  getProductById: async (productId: string) => {
    const { firestore } = useFirebaseStore.getState();
    const { branchId } = useAuthStore.getState();
    if (!firestore || !branchId) return undefined;
  
    set({ isFetching: true });
    try {
      const productRef = doc(firestore, 'products', productId);
      const docSnap = await getDoc(productRef);
  
      if (docSnap.exists() && docSnap.data().branchId === branchId) {
        const productData = { id: docSnap.id, ...docSnap.data() } as Product;
        
        if (productData.satuan_id && !productData.nama_satuan) {
          const unitRef = doc(firestore, 'units', productData.satuan_id);
          const unitSnap = await getDoc(unitRef);
          if (unitSnap.exists()) {
            productData.nama_satuan = unitSnap.data().nama_satuan;
          }
        }
        return productData;
      }
      return undefined;
    } catch (error) {
      console.error("Failed to fetch product:", error);
      return undefined;
    } finally {
      set({ isFetching: false });
    }
  },

  importProducts: async (productsToImport) => {
    const { firestore } = useFirebaseStore.getState();
    const { branchId } = useAuthStore.getState();
    if (!firestore || !branchId) return;

    set({ isSubmitting: true });
    toast({ title: 'Memulai Impor', description: 'Memproses kategori dan satuan...' });

    try {
      const batch = writeBatch(firestore);
      const categoriesRef = collection(firestore, 'categories');
      const unitsRef = collection(firestore, 'units');
      const productsRef = collection(firestore, 'products');

      // 1. Fetch existing categories and units for the branch
      const existingCategoriesQuery = query(categoriesRef, where('branchId', '==', branchId));
      const existingUnitsQuery = query(unitsRef, where('branchId', '==', branchId));
      const [categoriesSnapshot, unitsSnapshot] = await Promise.all([getDocs(existingCategoriesQuery), getDocs(existingUnitsQuery)]);
      const categoryMap = new Map(categoriesSnapshot.docs.map(doc => [doc.data().nama_kategori.toLowerCase(), doc.id]));
      const unitMap = new Map(unitsSnapshot.docs.map(doc => [doc.data().nama_satuan.toLowerCase(), doc.id]));

      // 2. Identify and create new categories/units
      for (const product of productsToImport) {
        const categoryName = product.nama_kategori.toLowerCase();
        if (!categoryMap.has(categoryName)) {
          const newCategoryRef = doc(categoriesRef);
          batch.set(newCategoryRef, { nama_kategori: product.nama_kategori, branchId });
          categoryMap.set(categoryName, newCategoryRef.id); // Add to map to prevent duplicates in this batch
        }

        const unitName = product.nama_satuan.toLowerCase();
        if (!unitMap.has(unitName)) {
          const newUnitRef = doc(unitsRef);
          batch.set(newUnitRef, { nama_satuan: product.nama_satuan, branchId });
          unitMap.set(unitName, newUnitRef.id);
        }
      }

      toast({ title: 'Memproses Impor', description: 'Menyiapkan data produk...' });

      // 3. Prepare products for batch write
      for (const product of productsToImport) {
        const productDocRef = doc(productsRef);
        const newProduct: Omit<Product, 'id'> = {
          nama_produk: product.nama_produk,
          kode_produk: product.kode_produk,
          stok: product.stok,
          harga_modal: product.harga_modal,
          harga_jual: product.harga_jual,
          kategori_id: categoryMap.get(product.nama_kategori.toLowerCase())!,
          satuan_id: unitMap.get(product.nama_satuan.toLowerCase())!,
          branchId: branchId,
          status: 'Tersedia',
        };
        batch.set(productDocRef, newProduct);
      }

      // 4. Commit the batch
      await batch.commit();
      
      toast({ title: 'Impor Selesai', description: `${productsToImport.length} produk berhasil diimpor.` });
      await get().fetchProducts(); // Refresh product list

    } catch (error) {
      console.error("Failed to import products:", error);
      toast({ variant: 'destructive', title: 'Impor Gagal', description: 'Terjadi kesalahan saat menyimpan data.' });
    } finally {
      set({ isSubmitting: false });
    }
  },

  resetAllStock: async () => {
    const { firestore } = useFirebaseStore.getState();
    const { branchId } = useAuthStore.getState();
    if (!firestore || !branchId) return;

    set({ isDeleting: true });
    try {
      const productsRef = collection(firestore, 'products');
      const q = query(productsRef, where("branchId", "==", branchId));
      const productsSnapshot = await getDocs(q);

      if (productsSnapshot.empty) {
        toast({ title: "Tidak Ada Produk", description: "Tidak ada produk untuk direset stoknya." });
        return;
      }
      
      const batch = writeBatch(firestore);
      
      productsSnapshot.docs.forEach(productDoc => {
        const productRef = doc(firestore, 'products', productDoc.id);
        batch.update(productRef, { stok: 0 });
      });

      await batch.commit();
      toast({ title: "Sukses", description: "Stok semua produk telah direset menjadi 0." });
      get().fetchProducts();
    } catch (error) {
      console.error("Failed to reset all stock:", error);
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan saat mereset stok produk." });
    } finally {
      set({ isDeleting: false });
    }
  },
  
  reconcileUnitData: async () => {
    const { firestore } = useFirebaseStore.getState();
    const { branchId } = useAuthStore.getState();
    if (!firestore || !branchId) return { count: 0, products: [] };

    set({ isSubmitting: true });
    try {
        const unitsRef = collection(firestore, 'units');
        const productsRef = collection(firestore, 'products');

        const unitsQuery = query(unitsRef, where('branchId', '==', branchId));
        const productsQuery = query(productsRef, where('branchId', '==', branchId));

        const [unitsSnapshot, productsSnapshot] = await Promise.all([
            getDocs(unitsQuery),
            getDocs(productsQuery)
        ]);

        const unitMap = new Map(unitsSnapshot.docs.map(doc => [doc.data().nama_satuan.toLowerCase(), doc.id]));
        const productsToUpdate: Product[] = [];
        const batch = writeBatch(firestore);

        productsSnapshot.forEach(doc => {
            const product = { id: doc.id, ...doc.data() } as Product;
            const unitName = product.nama_satuan?.toLowerCase();
            if (unitName && unitMap.has(unitName)) {
                const correctUnitId = unitMap.get(unitName);
                if (product.satuan_id !== correctUnitId) {
                    const productRef = doc(firestore, 'products', product.id);
                    batch.update(productRef, { satuan_id: correctUnitId });
                    productsToUpdate.push(product);
                }
            }
        });
        
        if (productsToUpdate.length > 0) {
            await batch.commit();
        }

        return { count: productsToUpdate.length, products: productsToUpdate };

    } catch (error) {
        console.error("Failed to reconcile unit data:", error);
        toast({ variant: 'destructive', title: 'Gagal', description: 'Terjadi kesalahan saat pemadanan data satuan.' });
        return { count: 0, products: [] };
    } finally {
        set({ isSubmitting: false });
    }
  },
}));
