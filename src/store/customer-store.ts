"use client";
import { create } from 'zustand';
import { Customer, PaginatedResponse } from '@/lib/types';
import { toast } from '@/hooks/use-toast';

type CustomerState = {
  customers: Customer[];
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
  fetchCustomers: () => Promise<void>;
  getCustomerById: (customerId: number) => Promise<Customer | undefined>;
  addCustomer: (customer: Omit<Customer, 'id' | 'tenant_id'>) => Promise<void>;
  editCustomer: (customer: Customer) => Promise<void>;
  deleteCustomer: (customerId: number) => Promise<void>;
};

export const useCustomerStore = create<CustomerState>((set, get) => ({
  customers: [],
  total: 0,
  page: 1,
  limit: 10,
  searchTerm: '',
  isFetching: false,
  isSubmitting: false,
  isDeleting: false,

  setPage: (page) => set({ page, customers: [] }),
  setLimit: (limit) => set({ limit, page: 1, customers: [] }),
  setSearchTerm: (searchTerm) => set({ searchTerm, page: 1, customers: [] }),

  fetchCustomers: async () => {
    const { page, limit, searchTerm } = get();
    set({ isFetching: true });
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search: searchTerm,
      });
      const response = await fetch(`/api/customers?${params.toString()}`);
      const data: PaginatedResponse<Customer> = await response.json();
      set({ customers: data.data, total: data.total, page: data.page, isFetching: false });
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      set({ isFetching: false });
      toast({ variant: "destructive", title: "Gagal Mengambil Data", description: "Terjadi kesalahan saat mengambil data pelanggan." });
    }
  },

  getCustomerById: async (customerId: number) => {
    set({ isFetching: true });
    try {
      const response = await fetch(`/api/customers/${customerId}`);
      if (!response.ok) throw new Error("Customer not found");
      const customer: Customer = await response.json();
      return customer;
    } catch (error) {
      console.error("Failed to fetch customer:", error);
      toast({ variant: "destructive", title: "Gagal Mengambil Data", description: "Pelanggan tidak ditemukan." });
      return undefined;
    } finally {
      set({ isFetching: false });
    }
  },

  addCustomer: async (customer) => {
    set({ isSubmitting: true });
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customer),
      });
      if (response.ok) {
        toast({ title: "Pelanggan Ditambahkan", description: "Pelanggan baru telah berhasil ditambahkan." });
        await get().fetchCustomers();
      } else {
        throw new Error("Failed to add customer");
      }
    } catch (error) {
      console.error("Failed to add customer:", error);
      toast({ variant: "destructive", title: "Gagal Menambahkan", description: "Terjadi kesalahan saat menambahkan pelanggan." });
    } finally {
      set({ isSubmitting: false });
    }
  },

  editCustomer: async (updatedCustomer) => {
    set({ isSubmitting: true });
    try {
      const response = await fetch(`/api/customers/${updatedCustomer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCustomer),
      });
      if (response.ok) {
         toast({ title: "Pelanggan Diperbarui", description: "Perubahan pada pelanggan telah berhasil disimpan." });
        await get().fetchCustomers();
      } else {
        throw new Error("Failed to edit customer");
      }
    } catch (error) {
      console.error("Failed to edit customer:", error);
       toast({ variant: "destructive", title: "Gagal Memperbarui", description: "Terjadi kesalahan saat memperbarui pelanggan." });
    } finally {
      set({ isSubmitting: false });
    }
  },

  deleteCustomer: async (customerId) => {
    set({ isDeleting: true });
    try {
      const response = await fetch(`/api/customers/${customerId}`, { method: 'DELETE' });
      if (response.ok) {
        toast({ title: "Pelanggan Dihapus", description: "Pelanggan telah berhasil dihapus." });
        await get().fetchCustomers();
      } else {
         throw new Error("Failed to delete customer");
      }
    } catch (error) {
      console.error("Failed to delete customer:", error);
      toast({ variant: "destructive", title: "Gagal Menghapus", description: "Terjadi kesalahan saat menghapus pelanggan." });
    } finally {
      set({ isDeleting: false });
    }
  },
}));
