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
  id: number;
  kode_produk: string;
  nama_produk: string;
  satuan_id: number;
  nama_satuan?: string;
  stok: number;
  harga_modal: number;
  harga_jual: number;
  kategori_id: number;
  nama_kategori?: string; // Optional, joined from categories table
  branch_id: number;
}

export interface Category {
  id: number;
  nama_kategori: string;
  tenant_id: number;
}

export interface Unit {
  id: number;
  nama_satuan: string;
  tenant_id: number;
}

export interface Customer {
  id: number;
  nama_customer: string;
  alamat?: string;
  telepon?: string;
  email?: string;
  tenant_id: number;
}

export interface Supplier {
  id: number;
  nama_supplier: string;
  alamat?: string;
  telepon?: string;
  email?: string;
  tenant_id: number;
}


export type Transaction = {
  id: string;
  type: "Sale" | "Purchase";
  date: string;
  items: number;
  amount: number;
};

export type Sale = {
    id: string;
    customer: string;
    date: string;
    total: number;
    status: 'Completed' | 'Pending' | 'Canceled';
}

export type PurchaseStatus = 'DRAFT' | 'DIPESAN' | 'DITERIMA_SEBAGIAN' | 'DITERIMA_PENUH' | 'DIBATALKAN';

export interface PurchaseItem {
  id: string | number; // Can be string for form, number from DB
  produk_id: number;
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
}

export interface Purchase {
  id: number;
  nomor_pembelian: string;
  supplier_id: number;
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
}


export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};
