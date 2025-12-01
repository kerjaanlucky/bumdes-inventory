
import {
  collection,
  writeBatch,
  getDocs,
  query,
  where,
  doc,
  Firestore,
} from 'firebase/firestore';
import { productSeedData } from './mock/seed-data';

// Helper function to get or create a document and return its ID
const getOrCreateDoc = async (
  batch: ReturnType<typeof writeBatch>,
  firestore: Firestore,
  collectionName: string,
  field: string,
  value: string,
  branchId: string
) => {
  const collectionRef = collection(firestore, collectionName);
  const q = query(
    collectionRef,
    where(field, '==', value),
    where('branchId', '==', branchId)
  );
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    // Return existing document ID
    return snapshot.docs[0].id;
  } else {
    // Create a new document and return its new ID
    const newDocRef = doc(collectionRef);
    batch.set(newDocRef, { [field]: value, branchId: branchId });
    return newDocRef.id;
  }
};

export const seedProducts = async (firestore: Firestore, branchId: string) => {
  const batch = writeBatch(firestore);

  // --- 1. Get or create Categories and Units ---
  const categories = {
    'Bahan Makanan': await getOrCreateDoc(batch, firestore, 'categories', 'nama_kategori', 'Bahan Makanan', branchId),
    'Minuman': await getOrCreateDoc(batch, firestore, 'categories', 'nama_kategori', 'Minuman', branchId),
  };

  const units = {
    'Pcs': await getOrCreateDoc(batch, firestore, 'units', 'nama_satuan', 'Pcs', branchId),
    'Kg': await getOrCreateDoc(batch, firestore, 'units', 'nama_satuan', 'Kg', branchId),
    'Liter': await getOrCreateDoc(batch, firestore, 'units', 'nama_satuan', 'Liter', branchId),
  };

  // --- 2. Create Products ---
  const productsRef = collection(firestore, 'products');

  for (const product of productSeedData) {
    const productDocRef = doc(productsRef); // Create a new reference for each product

    const randomStock = Math.floor(Math.random() * 200);
    const costPrice = Math.floor(Math.random() * (10 - 2 + 1)) + 2; // Random cost between $2 and $10
    const sellingPrice = Math.round(costPrice * 1.3); // 30% markup

    let categoryId;
    let unitId;

    switch (product.type) {
        case 'Food':
            categoryId = categories['Bahan Makanan'];
            unitId = product.name.includes('Daging') || product.name.includes('Ayam') || product.name.includes('Ikan') ? units['Kg'] : units['Pcs'];
            break;
        case 'Drink':
            categoryId = categories['Minuman'];
            unitId = units['Liter'];
            break;
        default:
            categoryId = categories['Bahan Makanan'];
            unitId = units['Pcs'];
    }

    const newProduct = {
      nama_produk: product.name,
      kode_produk: Math.floor(10000000 + Math.random() * 90000000).toString(),
      stok: randomStock,
      harga_modal: costPrice * 1000, // Convert to Rupiah-like value
      harga_jual: sellingPrice * 1000,
      kategori_id: categoryId,
      satuan_id: unitId,
      branchId: branchId,
      status: 'Tersedia',
    };

    batch.set(productDocRef, newProduct);
  }

  // --- 3. Commit the batch ---
  await batch.commit();
};
