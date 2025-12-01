import { create } from 'zustand';
import { Product, PaginatedResponse, StockMovement, Category, Unit } from '@/lib/types';
import { useStockStore } from './stock-store';
import { collection, query, where, getDocs, addDoc, doc, setDoc, deleteDoc, getDoc, or, and } from 'firebase/firestore';
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

    const { searchTerm, filterCategoryId, page, limit } = get();
    set({ isFetching: true });

    try {
      // Fetch categories and units for mapping names
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
      
      // Build the product query
      const productsRef = collection(firestore, 'products');
      const queryConstraints = [where("branchId", "==", branchId)];

      if (filterCategoryId) {
        queryConstraints.push(where("kategori_id", "==", filterCategoryId));
      }
      
      // Handle search term using OR condition for multiple fields
      if (searchTerm) {
          // Firestore doesn't support case-insensitive search natively.
          // A common workaround is to store a lowercased version of the field.
          // For simplicity here, we'll stick to client-side filtering after a broader fetch,
          // but for larger datasets, a more advanced solution like a search service (e.g., Algolia) is recommended.
          // Let's implement a more targeted query. We can't do OR on different fields directly
          // without composite indexes. Let's assume we search by name primarily.
          // A better approach is often to fetch based on one field or fetch all and filter client side for moderate data sizes.
          // Given the user's request, we'll attempt a more direct query approach.
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

      // Client-side search as Firestore doesn't support partial string matches easily
       if (searchTerm) {
        const lowercasedSearchTerm = searchTerm.toLowerCase();
        productsData = productsData.filter(p => 
          p.nama_produk.toLowerCase().includes(lowercasedSearchTerm) ||
          p.kode_produk.toLowerCase().includes(lowercasedSearchTerm)
        );
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
    if (!firestore) return Promise.reject("Firestore not initialized");

    if (!isStockUpdate) {
        set({ isSubmitting: true });
    }
    const productRef = doc(firestore, `products`, updatedProduct.id);
    
    // Call non-blocking function without chaining .then()
    setDocumentNonBlocking(productRef, updatedProduct, { merge: true });

    // Optimistically update the state for UI responsiveness immediately
    set((state) => ({
        products: state.products.map((p) =>
        p.id === updatedProduct.id ? { ...p, ...updatedProduct } : p
        ),
    }));

    // If it's a regular edit (not just a background stock update), re-fetch for consistency
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
  
  getProductById: async (productId: string) => {
    const { firestore } = useFirebaseStore.getState();
    const { branchId } = useAuthStore.getState();
    if (!firestore || !branchId) return undefined;
  
    // Always fetch from Firestore to ensure the most up-to-date data, especially the unit name.
    set({ isFetching: true });
    try {
      const productRef = doc(firestore, 'products', productId);
      const docSnap = await getDoc(productRef);
  
      if (docSnap.exists() && docSnap.data().branchId === branchId) {
        const productData = { id: docSnap.id, ...docSnap.data() } as Product;
        
        // Ensure nama_satuan is populated
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
}));

    