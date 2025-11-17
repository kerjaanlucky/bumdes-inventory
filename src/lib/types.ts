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

export type Item = {
  id: string;
  name:string;
  sku: string;
  category: string;
  stock: number;
  price: number;
  status: "In Stock" | "Low Stock" | "Out of Stock";
};

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

export type Purchase = {
    id: string;
    supplier: string;
    date: string;
    total: number;
    status: 'Received' | 'Ordered' | 'Pending';
}
