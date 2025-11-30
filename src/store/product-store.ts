import { create } from 'zustand';
import { Product, PaginatedResponse, StockMovement } from '@/lib/types';
import { useStockStore } from './stock-store';
import { collection, query, where, getDocs, addDoc, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { useAuthStore } from './auth-store';
import { useFirebaseStore } from './firebase-store';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';

type ProductState = {
  products: Product[];
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
  fetchProducts: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'branch_id'>) => Promise<void>;
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
  isFetching: false,
  isSubmitting: false,
  isDeleting: false,
  setPage: (page) => set({ page, products: [] }),
  setLimit: (limit) => set({ limit, page: 1, products: [] }),
  setSearchTerm: (searchTerm) => set({ searchTerm, page: 1, products: [] }),
  
  fetchProducts: async () => {
    const { firestore } = useFirebaseStore.getState();
    const { branchId } = useAuthStore.getState();
    if (!firestore || !branchId) return;

    set({ isFetching: true });
    try {
      const productsRef = collection(firestore, `branches/${branchId}/products`);
      // Basic client-side search for simplicity. For larger datasets, use a search service like Algolia.
      const q = query(productsRef);
      const querySnapshot = await getDocs(q);
      let products: Product[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      
      const { searchTerm, page, limit } = get();
      if (searchTerm) {
        products = products.filter(p => 
          p.nama_produk.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.kode_produk.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      const total = products.length;
      const paginatedProducts = products.slice((page - 1) * limit, page * limit);

      set({ 
        products: paginatedProducts,
        total: total,
        page: page,
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
    const productsRef = collection(firestore, `branches/${branchId}/products`);
    addDocumentNonBlocking(productsRef, { ...product, branchId })
        .then(() => get().fetchProducts())
        .catch(err => console.error("Failed to add product", err))
        .finally(() => set({ isSubmitting: false }));
  },

  editProduct: async (updatedProduct, isStockUpdate = false) => {
    const { firestore } = useFirebaseStore.getState();
    const { branchId } = useAuthStore.getState();
    if (!firestore || !branchId) return;

    if (!isStockUpdate) {
        set({ isSubmitting: true });
    }
    const productRef = doc(firestore, `branches/${branchId}/products`, updatedProduct.id);
    setDocumentNonBlocking(productRef, updatedProduct, { merge: true })
      .then(() => {
        if (!isStockUpdate) {
            get().fetchProducts();
        } else {
             set((state) => ({
                products: state.products.map((p) =>
                p.id === updatedProduct.id ? updatedProduct : p
                ),
            }));
        }
      })
      .catch(err => console.error("Failed to edit product:", err))
      .finally(() => {
        if (!isStockUpdate) {
          set({ isSubmitting: false });
        }
      });
  },

  deleteProduct: async (productId) => {
    const { firestore } = useFirebaseStore.getState();
    const { branchId } = useAuthStore.getState();
    if (!firestore || !branchId) return;
    
    set({ isDeleting: true });
    const productRef = doc(firestore, `branches/${branchId}/products`, productId);
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
      const productRef = doc(firestore, `branches/${branchId}/products`, productId);
      const docSnap = await getDoc(productRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Product;
      }
      return undefined;
    } catch (error) {
      console.error("Failed to fetch product:", error);
      return undefined;
    }
  },
}));
