

"use client";

import { create } from 'zustand';
import { Sale, CogsItem, Product, Expense } from '@/lib/types';
import { DateRange } from 'react-day-picker';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { useAuthStore } from './auth-store';
import { useFirebaseStore } from './firebase-store';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';

export type DashboardSummary = {
  todayRevenue: number;
  yesterdayRevenue: number;
  todayProfit: number;
  todayTransactions: number;
  lowStockItems: number;
  todayExpenses: number;
};

export type DashboardChartData = {
  date: string;
  penjualan: number;
  laba: number;
}

export type DashboardData = {
    summary: DashboardSummary;
    topProducts: { nama_produk: string; kode_produk: string; total_quantity: number }[];
    chartData: DashboardChartData[];
};


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
  dashboardData: DashboardData | null;
  isFetching: boolean;
  dateRange?: DateRange;
  setDateRange: (dateRange?: DateRange) => void;
  fetchSalesReport: () => Promise<void>;
  fetchProfitAndLossReport: () => Promise<void>;
  fetchCogsReport: () => Promise<void>;
  fetchDashboardData: (timeRange: '1d' | '7d' | '30d') => Promise<void>;
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

const initialDashboardData: DashboardData = {
    summary: {
        todayRevenue: 0,
        yesterdayRevenue: 0,
        todayProfit: 0,
        todayTransactions: 0,
        lowStockItems: 0,
        todayExpenses: 0,
    },
    topProducts: [],
    chartData: [],
}

export const useReportStore = create<ReportState>((set, get) => ({
  sales: [],
  summary: initialSummary,
  profitAndLoss: initialProfitAndLoss,
  cogsData: [],
  cogsSummary: initialCogsSummary,
  dashboardData: null,
  isFetching: false,
  dateRange: {
    from: subDays(new Date(), 29),
    to: new Date(),
  },

  setDateRange: (dateRange?: DateRange) => set({ dateRange }),

  fetchDashboardData: async (timeRange) => {
    const { firestore } = useFirebaseStore.getState();
    const { branchId } = useAuthStore.getState();
    if (!firestore || !branchId) return;

    set({ isFetching: true });

    try {
        const today = new Date();
        const yesterday = subDays(today, 1);
        
        let daysToFetch;
        if (timeRange === '1d') daysToFetch = 0;
        else if (timeRange === '7d') daysToFetch = 6;
        else daysToFetch = 29;

        const startDate = subDays(today, daysToFetch);
        const startDateString = format(startDate, 'yyyy-MM-dd');
        
        // --- Queries ---
        const salesRef = collection(firestore, 'sales');
        const salesQuery = query(
            salesRef,
            where('branchId', '==', branchId),
            where('status', 'in', ['LUNAS', 'DIKIRIM']),
            where('tanggal_penjualan', '>=', startDateString)
        );
        
        const expensesRef = collection(firestore, 'expenses');
        const expensesQuery = query(
            expensesRef,
            where('branchId', '==', branchId),
            where('tanggal', '>=', startOfDay(startDate))
        );

        const productsRef = collection(firestore, 'products');
        const productsQuery = query(productsRef, where('branchId', '==', branchId));

        const [salesSnapshot, productsSnapshot, expensesSnapshot] = await Promise.all([
            getDocs(salesQuery),
            getDocs(productsQuery),
            getDocs(expensesQuery)
        ]);
        
        const sales = salesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));
        const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        const expenses = expensesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
        const productsMap = new Map(products.map(p => [p.id, p]));

        // --- Calculations ---
        let todayRevenue = 0;
        let yesterdayRevenue = 0;
        let todayProfit = 0;
        let todayTransactions = 0;
        const topProductsMap = new Map<string, number>();
        const chartDataMap = new Map<string, { penjualan: number, laba: number }>();

        const todayStr = format(today, 'yyyy-MM-dd');
        const yesterdayStr = format(yesterday, 'yyyy-MM-dd');
        
        let todayExpenses = 0;
        for (const expense of expenses) {
            const expenseDate = format((expense.tanggal as any).toDate(), 'yyyy-MM-dd');
            if (expenseDate === todayStr) {
                todayExpenses += expense.jumlah;
            }
        }


        for (const sale of sales) {
            const saleDate = sale.tanggal_penjualan;
            
            // For summary cards
            if (saleDate === todayStr) {
                todayRevenue += sale.total_harga;
                todayTransactions += 1;
                for (const item of sale.items) {
                    todayProfit += (item.harga_jual_satuan - item.harga_modal) * item.jumlah;
                    topProductsMap.set(item.produk_id, (topProductsMap.get(item.produk_id) || 0) + item.jumlah);
                }
            } else if (saleDate === yesterdayStr) {
                yesterdayRevenue += sale.total_harga;
            }

            // For chart
            const chartDateFormat = timeRange === '1d' ? 'HH:00' : 'dd/MM';
            const formattedDate = format(new Date(sale.created_at), chartDateFormat);
            const dayData = chartDataMap.get(formattedDate) || { penjualan: 0, laba: 0 };
            dayData.penjualan += sale.total_harga;
            for (const item of sale.items) {
                dayData.laba += (item.harga_jual_satuan - item.harga_modal) * item.jumlah;
            }
            chartDataMap.set(formattedDate, dayData);
        }

        const lowStockItems = products.filter(p => p.stok > 0 && p.stok < 10).length;

        const topProducts = Array.from(topProductsMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([productId, quantity]) => {
                const product = productsMap.get(productId);
                return {
                    nama_produk: product?.nama_produk || 'N/A',
                    kode_produk: product?.kode_produk || 'N/A',
                    total_quantity: quantity,
                };
            });
            
        let chartData: DashboardChartData[] = [];
        if (timeRange === '1d') {
             chartData = Array.from({ length: 24 }, (_, i) => {
                const hour = String(i).padStart(2, '0') + ':00';
                return {
                    date: hour,
                    penjualan: chartDataMap.get(hour)?.penjualan || 0,
                    laba: chartDataMap.get(hour)?.laba || 0,
                };
            });
        } else {
             chartData = Array.from({ length: daysToFetch + 1 }, (_, i) => {
                const date = subDays(today, i);
                const formattedDate = format(date, 'dd/MM');
                return {
                    date: formattedDate,
                    penjualan: chartDataMap.get(formattedDate)?.penjualan || 0,
                    laba: chartDataMap.get(formattedDate)?.laba || 0,
                };
            }).reverse();
        }

        set({
            dashboardData: {
                summary: { todayRevenue, yesterdayRevenue, todayProfit, todayTransactions, lowStockItems, todayExpenses },
                topProducts,
                chartData,
            },
            isFetching: false,
        });

    } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        set({ isFetching: false, dashboardData: initialDashboardData });
    }
  },

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
        where('tanggal_penjualan', '>=', format(dateRange.from, 'yyyy-MM-dd')),
        where('tanggal_penjualan', '<=', format(dateRange.to || new Date(), 'yyyy-MM-dd'))
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
            where('tanggal_penjualan', '>=', format(dateRange.from, 'yyyy-MM-dd')),
            where('tanggal_penjualan', '<=', format(dateRange.to || new Date(), 'yyyy-MM-dd'))
        );

        const salesSnapshot = await getDocs(salesQuery);
        const sales = salesSnapshot.docs.map(doc => doc.data() as Sale);
        
        let totalRevenue = 0;
        let totalCogs = 0;
        let totalExpenses = 0;

        for (const sale of sales) {
            totalRevenue += sale.total_harga;
            totalExpenses += (sale.diskon_invoice || 0) + (sale.ongkos_kirim || 0) + (sale.biaya_lain || 0);
             for (const item of sale.items) {
                totalCogs += item.harga_modal * item.jumlah;
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
        where('tanggal_penjualan', '>=', format(dateRange.from, 'yyyy-MM-dd')),
        where('tanggal_penjualan', '<=', format(dateRange.to || new Date(), 'yyyy-MM-dd'))
      );

      const salesSnapshot = await getDocs(salesQuery);
      const sales = salesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));

      const cogsItems: CogsItem[] = [];
      let totalRevenue = 0;
      let totalCogs = 0;

      for (const sale of sales) {
        for (const item of sale.items) {
          const costPrice = item.harga_modal || 0;
          const totalSellingPrice = item.harga_jual_satuan * item.jumlah;
          const totalCostPrice = costPrice * item.jumlah;
          const itemMargin = totalSellingPrice - totalCostPrice;

          cogsItems.push({
            saleId: sale.id,
            saleDate: sale.tanggal_penjualan,
            productName: item.nama_produk || 'Produk Tidak Ditemukan',
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

      set({
        cogsData: cogsItems,
        cogsSummary: {
          totalRevenue,
          totalCogs,
          totalMargin: totalRevenue - totalCogs,
        },
        isFetching: false,
      });

    } catch (error) {
      console.error("Failed to fetch COGS report:", error);
      set({ isFetching: false });
    }
  },
}));
