
"use client";

import { create } from 'zustand';
import { Sale, CogsItem, Product, Expense, ExpenseCategory } from '@/lib/types';
import { DateRange } from 'react-day-picker';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { useAuthStore } from './auth-store';
import { useFirebaseStore } from './firebase-store';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';

export type DashboardSummary = {
  totalRevenue: number;
  yesterdayRevenue: number;
  totalProfit: number;
  totalTransactions: number;
  lowStockItems: number;
  totalExpenses: number;
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

type ExpenseReportSummary = {
    totalExpenses: number;
}

type ProfitAndLoss = {
  revenue: number;
  cogs: number; // Cost of Goods Sold
  grossProfit: number;
  expenses: number; // Discounts, shipping, etc. + operational expenses
  netProfit: number;
};

export type CogsSummary = {
    totalRevenue: number;
    totalCogs: number;
    totalMargin: number;
}

type ReportState = {
  sales: Sale[];
  expenses: Expense[];
  summary: SalesReportSummary;
  expenseSummary: ExpenseReportSummary;
  profitAndLoss: ProfitAndLoss;
  cogsData: CogsItem[];
  cogsSummary: CogsSummary;
  dashboardData: DashboardData | null;
  isFetching: boolean;
  dateRange?: DateRange;
  setDateRange: (dateRange?: DateRange) => void;
  fetchSalesReport: () => Promise<void>;
  fetchExpensesReport: () => Promise<void>;
  fetchProfitAndLossReport: () => Promise<void>;
  fetchCogsReport: () => Promise<void>;
  fetchDashboardData: (timeRange: '1d' | '7d' | '30d') => Promise<void>;
};

const initialSummary: SalesReportSummary = {
  totalRevenue: 0,
  totalTransactions: 0,
  averageTransactionValue: 0,
};

const initialExpenseSummary: ExpenseReportSummary = {
  totalExpenses: 0,
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
        totalRevenue: 0,
        yesterdayRevenue: 0,
        totalProfit: 0,
        totalTransactions: 0,
        lowStockItems: 0,
        totalExpenses: 0,
    },
    topProducts: [],
    chartData: [],
}

export const useReportStore = create<ReportState>((set, get) => ({
  sales: [],
  expenses: [],
  summary: initialSummary,
  expenseSummary: initialExpenseSummary,
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
        
        // --- Queries ---
        const salesRef = collection(firestore, 'sales');
        // Fetch sales from start date to today, plus one extra day for yesterday's revenue comparison
        const salesQuery = query(
            salesRef,
            where('branchId', '==', branchId),
            where('status', 'in', ['LUNAS', 'DIKIRIM']),
            where('tanggal_penjualan', '>=', format(subDays(startDate, 1), 'yyyy-MM-dd'))
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
        
        const allSales = salesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));
        const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        const expenses = expensesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), tanggal: (doc.data().tanggal as Timestamp).toDate() } as Expense));
        const productsMap = new Map(products.map(p => [p.id, p]));

        // --- Calculations ---
        let totalRevenue = 0;
        let yesterdayRevenue = 0;
        let totalProfit = 0;
        let totalTransactions = 0;
        let totalExpenses = 0;
        const topProductsMap = new Map<string, number>();
        const chartDataMap = new Map<string, { penjualan: number, laba: number }>();
        
        const yesterdayStr = format(yesterday, 'yyyy-MM-dd');
        
        // Calculate total expenses for the selected period
        for (const expense of expenses) {
            const expenseDate = expense.tanggal;
             if (expenseDate >= startOfDay(startDate) && expenseDate <= endOfDay(today)) {
                totalExpenses += expense.jumlah;
            }
        }

        for (const sale of allSales) {
            const saleDate = new Date(sale.tanggal_penjualan);

            // Calculate yesterday's revenue separately
            if (format(saleDate, 'yyyy-MM-dd') === yesterdayStr) {
                yesterdayRevenue += sale.total_harga;
            }

            // Process sales within the selected date range for cards and charts
            if (saleDate >= startOfDay(startDate) && saleDate <= endOfDay(today)) {
                totalRevenue += sale.total_harga;
                totalTransactions += 1;
                for (const item of sale.items) {
                    totalProfit += (item.harga_jual_satuan - item.harga_modal) * item.jumlah;
                    topProductsMap.set(item.produk_id, (topProductsMap.get(item.produk_id) || 0) + item.jumlah);
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
                summary: { totalRevenue, yesterdayRevenue, totalProfit, totalTransactions, lowStockItems, totalExpenses },
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
      const customersRef = collection(firestore, 'customers');
      const customersQuery = query(customersRef, where('branchId', '==', branchId));
      const customersSnapshot = await getDocs(customersQuery);
      const customersMap = new Map(customersSnapshot.docs.map(doc => [doc.id, doc.data().nama_customer]));
      
      const salesRef = collection(firestore, 'sales');
      const q = query(
        salesRef,
        where('branchId', '==', branchId),
        where('status', 'in', ['LUNAS', 'DIKIRIM', 'DIKONFIRMASI']),
        where('tanggal_penjualan', '>=', format(dateRange.from, 'yyyy-MM-dd')),
        where('tanggal_penjualan', '<=', format(dateRange.to || new Date(), 'yyyy-MM-dd'))
      );

      const querySnapshot = await getDocs(q);
      const sales: Sale[] = querySnapshot.docs.map(doc => {
        const data = doc.data() as Sale;
        return { 
          id: doc.id, 
          ...data,
          nama_customer: customersMap.get(data.customer_id) || 'N/A'
        };
      });

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
  
  fetchExpensesReport: async () => {
    const { firestore } = useFirebaseStore.getState();
    const { branchId } = useAuthStore.getState();
    const { dateRange } = get();

    if (!firestore || !branchId || !dateRange?.from) {
      set({ expenses: [], expenseSummary: initialExpenseSummary });
      return;
    }

    set({ isFetching: true });

    try {
      const expenseCatRef = collection(firestore, 'expenseCategories');
      const expenseCatQuery = query(expenseCatRef, where('branchId', '==', branchId));
      const catSnapshot = await getDocs(expenseCatQuery);
      const categoriesMap = new Map(catSnapshot.docs.map(doc => [doc.id, doc.data().nama_kategori]));
      
      const expensesRef = collection(firestore, 'expenses');
      const q = query(
        expensesRef,
        where('branchId', '==', branchId),
        where('tanggal', '>=', startOfDay(dateRange.from)),
        where('tanggal', '<=', endOfDay(dateRange.to || new Date()))
      );

      const querySnapshot = await getDocs(q);
      const expenses: Expense[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return { 
            id: doc.id,
            ...data,
            tanggal: (data.tanggal as Timestamp).toDate(),
            nama_kategori: categoriesMap.get(data.kategori_id) || 'Tanpa Kategori'
        } as Expense
      });

      const totalExpenses = expenses.reduce((acc, expense) => acc + expense.jumlah, 0);
      
      set({
        expenses,
        expenseSummary: { totalExpenses },
        isFetching: false,
      });
    } catch (error) {
      console.error("Failed to fetch expenses report:", error);
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
        
        const expensesRef = collection(firestore, 'expenses');
        const expensesQuery = query(
            expensesRef,
            where('branchId', '==', branchId),
            where('tanggal', '>=', startOfDay(dateRange.from)),
            where('tanggal', '<=', endOfDay(dateRange.to || new Date()))
        );

        const [salesSnapshot, expensesSnapshot] = await Promise.all([
            getDocs(salesQuery),
            getDocs(expensesQuery)
        ]);

        const sales = salesSnapshot.docs.map(doc => doc.data() as Sale);
        const expensesData = expensesSnapshot.docs.map(doc => doc.data() as Expense);
        
        let totalRevenue = 0;
        let totalCogs = 0;
        let totalOtherCosts = 0; // Costs from sales docs (discounts, shipping)

        for (const sale of sales) {
            totalRevenue += sale.total_harga;
            totalOtherCosts += (sale.diskon_invoice || 0) + (sale.ongkos_kirim || 0) + (sale.biaya_lain || 0);
             for (const item of sale.items) {
                totalCogs += item.harga_modal * item.jumlah;
            }
        }
        
        const totalOperationalExpenses = expensesData.reduce((acc, expense) => acc + expense.jumlah, 0);
        const totalExpenses = totalOtherCosts + totalOperationalExpenses;

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
