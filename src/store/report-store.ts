"use client";

import { create } from 'zustand';
import { Sale, CogsItem } from '@/lib/types';
import { DateRange } from 'react-day-picker';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { useAuthStore } from './auth-store';
import { useFirebaseStore } from './firebase-store';
import { subDays } from 'date-fns';

type SalesReportSummary = {
  totalRevenue: number;
  totalTransactions: number;
  averageTransactionValue: number;
};

type ProfitAndLoss = {
  revenue: number;
  cogs: number; // Cost of Goods Sold
  grossProfit: number;
  expenses: number; // Discounts, shipping, etc.
  netProfit: number;
};

export type CogsSummary = {
    totalRevenue: number;
    totalCogs: number;
    totalMargin: number;
}

type ReportState = {
  sales: Sale[];
  summary: SalesReportSummary;
  profitAndLoss: ProfitAndLoss;
  cogsData: CogsItem[];
  cogsSummary: CogsSummary;
  isFetching: boolean;
  dateRange?: DateRange;
  setDateRange: (dateRange?: DateRange) => void;
  fetchSalesReport: () => Promise<void>;
  fetchProfitAndLossReport: () => Promise<void>;
  fetchCogsReport: () => Promise<void>;
};

const initialSummary: SalesReportSummary = {
  totalRevenue: 0,
  totalTransactions: 0,
  averageTransactionValue: 0,
};

const initialProfitAndLoss: ProfitAndLoss = {
    revenue: 0,
    cogs: 0,
    grossProfit: 0,
    expenses: 0,
    netProfit: 0,
}

const initialCogsSummary: CogsSummary = {
    totalRevenue: 0,
    totalCogs: 0,
    totalMargin: 0,
}

export const useReportStore = create<ReportState>((set, get) => ({
  sales: [],
  summary: initialSummary,
  profitAndLoss: initialProfitAndLoss,
  cogsData: [],
  cogsSummary: initialCogsSummary,
  isFetching: false,
  dateRange: {
    from: subDays(new Date(), 29),
    to: new Date(),
  },

  setDateRange: (dateRange?: DateRange) => set({ dateRange }),

  fetchSalesReport: async () => {
    const { firestore } = useFirebaseStore.getState();
    const { branchId } = useAuthStore.getState();
    const { dateRange } = get();

    if (!firestore || !branchId || !dateRange?.from) {
      set({ sales: [], summary: initialSummary });
      return;
    }

    set({ isFetching: true });

    try {
      const salesRef = collection(firestore, 'sales');
      const q = query(
        salesRef,
        where('branchId', '==', branchId),
        where('status', 'in', ['LUNAS', 'DIKIRIM', 'DIKONFIRMASI']),
        where('tanggal_penjualan', '>=', dateRange.from.toISOString().split('T')[0]),
        where('tanggal_penjualan', '<=', (dateRange.to || new Date()).toISOString().split('T')[0])
      );

      const querySnapshot = await getDocs(q);
      const sales: Sale[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));

      const totalRevenue = sales.reduce((acc, sale) => acc + sale.total_harga, 0);
      const totalTransactions = sales.length;
      const averageTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

      set({
        sales,
        summary: {
          totalRevenue,
          totalTransactions,
          averageTransactionValue,
        },
        isFetching: false,
      });
    } catch (error) {
      console.error("Failed to fetch sales report:", error);
      set({ isFetching: false });
    }
  },
  
  fetchProfitAndLossReport: async () => {
    const { firestore } = useFirebaseStore.getState();
    const { branchId } = useAuthStore.getState();
    const { dateRange } = get();
    
    if (!firestore || !branchId || !dateRange?.from) {
      set({ profitAndLoss: initialProfitAndLoss });
      return;
    }
    
    set({ isFetching: true });

    try {
        const salesRef = collection(firestore, 'sales');
        const salesQuery = query(
            salesRef,
            where('branchId', '==', branchId),
            where('status', 'in', ['LUNAS', 'DIKIRIM']),
            where('tanggal_penjualan', '>=', dateRange.from.toISOString().split('T')[0]),
            where('tanggal_penjualan', '<=', (dateRange.to || new Date()).toISOString().split('T')[0])
        );

        const salesSnapshot = await getDocs(salesQuery);
        const sales = salesSnapshot.docs.map(doc => doc.data() as Sale);

        const productIds = Array.from(new Set(sales.flatMap(s => s.items.map(i => i.produk_id))));
        const productsMap = new Map<string, number>();

        // Fetch product costs in chunks if necessary
        if (productIds.length > 0) {
            const productsRef = collection(firestore, 'products');
            const productQuery = query(productsRef, where('__name__', 'in', productIds));
            const productsSnapshot = await getDocs(productQuery);
            productsSnapshot.forEach(doc => {
                productsMap.set(doc.id, doc.data().harga_modal || 0);
            });
        }
        
        let totalRevenue = 0;
        let totalCogs = 0;
        let totalExpenses = 0;

        for (const sale of sales) {
            totalRevenue += sale.total_harga;
            totalExpenses += (sale.diskon_invoice || 0) + (sale.ongkos_kirim || 0) + (sale.biaya_lain || 0);
             for (const item of sale.items) {
                totalCogs += (productsMap.get(item.produk_id) || 0) * item.jumlah;
            }
        }
        
        const grossProfit = totalRevenue - totalCogs;
        const netProfit = grossProfit - totalExpenses;
        
        set({
            profitAndLoss: {
                revenue: totalRevenue,
                cogs: totalCogs,
                grossProfit: grossProfit,
                expenses: totalExpenses,
                netProfit: netProfit,
            },
            isFetching: false,
        });

    } catch (error) {
        console.error("Failed to fetch profit and loss report:", error);
        set({ isFetching: false });
    }
  },

  fetchCogsReport: async () => {
    const { firestore } = useFirebaseStore.getState();
    const { branchId } = useAuthStore.getState();
    const { dateRange } = get();

    if (!firestore || !branchId || !dateRange?.from) {
      set({ cogsData: [], cogsSummary: initialCogsSummary });
      return;
    }

    set({ isFetching: true });
    try {
      const salesRef = collection(firestore, 'sales');
      const salesQuery = query(
        salesRef,
        where('branchId', '==', branchId),
        where('status', 'in', ['LUNAS', 'DIKIRIM']),
        where('tanggal_penjualan', '>=', dateRange.from.toISOString().split('T')[0]),
        where('tanggal_penjualan', '<=', (dateRange.to || new Date()).toISOString().split('T')[0])
      );

      const salesSnapshot = await getDocs(salesQuery);
      const sales = salesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));

      const productIds = Array.from(new Set(sales.flatMap(s => s.items.map(i => i.produk_id))));
      const productsMap = new Map<string, { nama_produk: string, harga_modal: number }>();

      if (productIds.length > 0) {
        const productsRef = collection(firestore, 'products');
        const productQuery = query(productsRef, where('__name__', 'in', productIds));
        const productsSnapshot = await getDocs(productQuery);
        productsSnapshot.forEach(doc => {
          const data = doc.data();
          productsMap.set(doc.id, { nama_produk: data.nama_produk, harga_modal: data.harga_modal || 0 });
        });
      }

      const cogsItems: CogsItem[] = [];
      let totalRevenue = 0;
      let totalCogs = 0;
      let totalMargin = 0;

      for (const sale of sales) {
        for (const item of sale.items) {
          const productInfo = productsMap.get(item.produk_id);
          const costPrice = productInfo?.harga_modal || 0;
          const totalSellingPrice = item.harga_jual_satuan * item.jumlah;
          const totalCostPrice = costPrice * item.jumlah;
          const itemMargin = totalSellingPrice - totalCostPrice;

          cogsItems.push({
            saleId: sale.id,
            saleDate: sale.tanggal_penjualan,
            productName: productInfo?.nama_produk || 'Produk Tidak Ditemukan',
            quantity: item.jumlah,
            sellingPrice: item.harga_jual_satuan,
            totalSellingPrice: totalSellingPrice,
            costPrice: costPrice,
            totalCostPrice: totalCostPrice,
            totalMargin: itemMargin,
          });

          totalRevenue += totalSellingPrice;
          totalCogs += totalCostPrice;
        }
      }

      totalMargin = totalRevenue - totalCogs;

      set({
        cogsData: cogsItems,
        cogsSummary: {
          totalRevenue,
          totalCogs,
          totalMargin,
        },
        isFetching: false,
      });

    } catch (error) {
      console.error("Failed to fetch COGS report:", error);
      set({ isFetching: false });
    }
  },
}));
