import { Transaction, Sale, Purchase, Product, Category, Unit } from "./types";
import mockProducts from './mock/products.json';
import mockCategories from './mock/categories.json';
import mockUnits from './mock/units.json';

// Gabungkan data mock dengan nama kategori dan satuan
export const products: Product[] = mockProducts.map(product => {
  const category = mockCategories.find(c => c.id === product.kategori_id);
  const unit = mockUnits.find(u => u.id === product.satuan_id);
  return {
    ...product,
    nama_kategori: category ? category.nama_kategori : 'N/A',
    nama_satuan: unit ? unit.nama_satuan : 'N/A',
  };
});

export const categories: Category[] = mockCategories;
export const units: Unit[] = mockUnits;

export const transactions: Transaction[] = [
    { id: 'TRN001', type: 'Sale', date: '2024-05-20', items: 2, amount: 1225.00 },
    { id: 'TRN002', type: 'Purchase', date: '2024-05-19', items: 50, amount: 25000.00 },
    { id: 'TRN003', type: 'Sale', date: '2024-05-18', items: 1, amount: 350.00 },
    { id: 'TRN004', type: 'Sale', date: '2024-05-18', items: 5, amount: 125.00 },
    { id: 'TRN005', type: 'Purchase', date: '2024-05-15', items: 10, amount: 800.00 },
];

export const sales: Sale[] = [
    { id: 'SALE001', customer: 'John Doe', date: '2024-05-20', total: 1225.00, status: 'Completed' },
    { id: 'SALE002', customer: 'Jane Smith', date: '2024-05-18', total: 350.00, status: 'Completed' },
    { id: 'SALE003', customer: 'Peter Jones', date: '2024-05-18', total: 125.00, status: 'Completed' },
    { id: 'SALE004', customer: 'Mary Lee', date: '2024-05-21', total: 80.00, status: 'Pending' },
    { id: 'SALE005', customer: 'Chris Green', date: '2024-05-19', total: 2400.00, status: 'Canceled' },
];

export const purchases: Purchase[] = [
    { id: 'PUR001', supplier: 'TechSupplier Inc.', date: '2024-05-19', total: 25000.00, status: 'Received' },
    { id: 'PUR002', supplier: 'AccessoryWorld', date: '2024-05-15', total: 800.00, status: 'Received' },
    { id: 'PUR003', supplier: 'Global Electronics', date: '2024-05-22', total: 15000.00, status: 'Ordered' },
    { id: 'PUR004', supplier: 'MonitorMakers', date: '2024-05-23', total: 7000.00, status: 'Pending' },
];

export const chartData = [
    { month: "January", total: Math.floor(Math.random() * 5000) + 1000 },
    { month: "February", total: Math.floor(Math.random() * 5000) + 1000 },
    { month: "March", total: Math.floor(Math.random() * 5000) + 1000 },
    { month: "April", total: Math.floor(Math.random() * 5000) + 1000 },
    { month: "May", total: Math.floor(Math.random() * 5000) + 1000 },
    { month: "June", total: Math.floor(Math.random() * 5000) + 1000 },
]
