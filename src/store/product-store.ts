import { create } from 'zustand';
import { Product, PaginatedResponse, StockMovement, Category, Unit } from '@/lib/types';
import { useStockStore } from './stock-store';
import { collection, query, where, getDocs, addDoc, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { useAuthStore } from './auth-store';
import { useFirebaseStore } from './firebase-store';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { useCategoryStore } from './category-store';
import { useUnitStore } from './unit-store';

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
  fetchProducts: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'branchId'>) => Promise<void>;
  editProduct: (product: Product, isStockUpdate?: boolean) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  getProductById: (productId: string) => Promise<Product | undefined>;
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
  
  fetchProducts: async () => {
    const { firestore } = useFirebaseStore.getState();
    const { branchId } = useAuthStore.getState();
    if (!firestore || !branchId) return;

    set({ isFetching: true });
    try {
      // Fetch all categories and units for the current branch first
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

      // Now fetch products
      const productsRef = collection(firestore, 'products');
      const q = query(productsRef, where("branchId", "==", branchId));
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
      
      const { searchTerm, filterCategoryId, page, limit } = get();
      if (searchTerm) {
        productsData = productsData.filter(p => 
          p.nama_produk.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.kode_produk.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (filterCategoryId) {
        productsData = productsData.filter(p => p.kategori_id === filterCategoryId);
      }
      
      const total = productsData.length;
      const paginatedProducts = productsData.slice((page - 1) * limit, page * limit);

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
    if (!firestore) return;

    if (!isStockUpdate) {
        set({ isSubmitting: true });
    }
    const productRef = doc(firestore, `products`, updatedProduct.id);
    setDocumentNonBlocking(productRef, updatedProduct, { merge: true })
      .then(() => {
         // Optimistically update the state for UI responsiveness
         set((state) => ({
            products: state.products.map((p) =>
            p.id === updatedProduct.id ? { ...p, ...updatedProduct } : p
            ),
        }));
        if (!isStockUpdate) {
            get().fetchProducts();
        }
      })
      .catch(err => console.error("Failed to edit product:", err))
      .finally(() => {
        if (!isStockUpdate) {
          set({ isSubmitting: false });
        }
      });
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
  
  getProductById: async (productId: string) => {
    const { firestore } = useFirebaseStore.getState();
    const { branchId } = useAuthStore.getState();
    if (!firestore || !branchId) return undefined;

    const productInState = get().products.find(p => p.id === productId);
    if (productInState) return productInState;

    try {
      const productRef = doc(firestore, `products`, productId);
      const docSnap = await getDoc(productRef);
      if (docSnap.exists() && docSnap.data().branchId === branchId) {
        return { id: docSnap.id, ...docSnap.data() } as Product;
      }
      return undefined;
    } catch (error) {
      console.error("Failed to fetch product:", error);
      return undefined;
    }
  },
}));
