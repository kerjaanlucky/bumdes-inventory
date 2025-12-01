

export type User = {
  id: string;
  name: string;
  email: string;
  role: "Manajer" | "Kasir";
  branch: string;
  avatar: string;
};

export type Branch = {
  id: string;
  name: string;
  location: string;
  invoiceTemplate?: 'sequential' | 'date' | 'custom';
  invoiceCustomFormat?: string;
  defaultTax?: number;
  phone?: string;
  email?: string;
  taxType?: 'inclusive' | 'exclusive';
  invoiceNotes?: string;
};

export interface Product {
  id: string;
  kode_produk: string;
  nama_produk: string;
  satuan_id: string;
  nama_satuan?: string;
  stok: number;
  harga_modal: number;
  harga_jual: number;
  kategori_id: string;
  nama_kategori?: string; // Optional, joined from categories table
  branchId: string;
  status: 'Tersedia' | 'Tidak Tersedia';
}

export interface Category {
  id: string;
  nama_kategori: string;
  branchId: string;
}

export interface Unit {
  id: string;
  nama_satuan: string;
  branchId: string;
}

export interface Customer {
  id: string;
  nama_customer: string;
  alamat?: string;
  telepon?: string;
  email?: string;
  branchId: string;
}

export interface Supplier {
  id: string;
  nama_supplier: string;
  nama_supplier_lowercase?: string;
  alamat?: string;
  telepon?: string;
  email?: string;
  branchId: string;
}


export type Transaction = {
  id: string;
  type: "Sale" | "Purchase";
  date: string;
  items: number;
  amount: number;
};

export type SaleStatus = 'DRAFT' | 'DIKONFIRMASI' | 'DIKIRIM' | 'LUNAS' | 'DIRETUR' | 'DIBATALKAN';

export interface SaleItem {
  id: any;
  produk_id: string;
  nama_produk: string;
  stok_tersedia: number; // To hold the available stock when item is added
  nama_satuan: string;
  jumlah: number;
  harga_jual_satuan: number;
  diskon: number;
  subtotal: number;
}

export interface SaleStatusHistory {
    status: SaleStatus;
    tanggal: string;
    oleh: string; // User name
    catatan?: string;
}

export interface Sale {
  id: string;
  nomor_penjualan: string;
  customer_id: string;
  nama_customer?: string;
  tanggal_penjualan: string;
  total_harga: number;
  diskon_invoice: number;
  pajak: number;
  taxType?: 'inclusive' | 'exclusive';
  ongkos_kirim: number;
  biaya_lain: number;
  status: SaleStatus;
  created_at: string;
  items: SaleItem[];
  history?: SaleStatusHistory[];
  branchId: string;
}


export type PurchaseStatus = 'DRAFT' | 'DIPESAN' | 'DITERIMA_SEBAGIAN' | 'DITERIMA_PENUH' | 'DIBATALKAN';

export interface PurchaseItem {
  id: any; // Can be string for form, number from DB
  produk_id: string;
  nama_produk: string;
  nama_satuan: string;
  jumlah: number;
  harga_beli_satuan: number;
  diskon: number;
  subtotal: number;
  jumlah_diterima: number;
  catatan_retur?: string | null;
  tanggal_diterima?: string | null;
}

export interface PurchaseStatusHistory {
    status: PurchaseStatus;
    tanggal: string;
    oleh: string; // User name
    catatan?: string;
}

export interface Purchase {
  id: string;
  nomor_pembelian: string;
  supplier_id: string;
  nama_supplier?: string;
  no_faktur_supplier: string;
  tanggal_pembelian: string;
  total_harga: number;
  diskon_invoice: number;
  pajak: number;
  ongkos_kirim: number;
  status: PurchaseStatus;
  created_at: string;
  items?: PurchaseItem[];
  history?: PurchaseStatusHistory[];
  branchId: string;
}

export type StockMovement = {
  id: string;
  tanggal: string;
  produk_id: string;
  nama_produk: string;
  nama_satuan: string;
  tipe: 'Pembelian Masuk' | 'Penjualan Keluar' | 'Penyesuaian' | 'Retur Penjualan';
  jumlah: number;
  stok_akhir: number;
  referensi: string;
  branchId: string;
  searchable_keywords?: string[];
};


export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};


export interface UserProfile {
  uid: string;
  email: string | null;
  name: string;
  role: 'admin' | 'user';
  branchId: string;
}

// Updated CogsItem for detailed report
export type CogsItem = {
  saleId: string;
  saleDate: string;
  productName: string;
  quantity: number;
  sellingPrice: number; // per unit
  totalSellingPrice: number; // sellingPrice * quantity
  costPrice: number; // per unit
  totalCostPrice: number; // costPrice * quantity
  totalMargin: number; // totalSellingPrice - totalCostPrice
};

export interface ExpenseCategory {
  id: string;
  nama_kategori: string;
  branchId: string;
}

export interface Expense {
  id: string;
  tanggal: string;
  jumlah: number;
  kategori_id: string;
  nama_kategori?: string; // Joined from category
  deskripsi: string;
  branchId: string;
}
