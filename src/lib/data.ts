import { User, Branch, Item, Transaction, Sale, Purchase } from "./types";

export const users: User[] = [
  { id: 'USR001', name: 'Alice Johnson', email: 'alice@example.com', role: 'Admin', branch: 'Main', avatar: '/avatars/01.png' },
  { id: 'USR002', name: 'Bob Williams', email: 'bob@example.com', role: 'User', branch: 'West', avatar: '/avatars/02.png' },
  { id: 'USR003', name: 'Charlie Brown', email: 'charlie@example.com', role: 'User', branch: 'East', avatar: '/avatars/03.png' },
  { id: 'USR004', name: 'Diana Miller', email: 'diana@example.com', role: 'User', branch: 'Main', avatar: '/avatars/04.png' },
];

export const branches: Branch[] = [
  { id: 'BRN01', name: 'Cabang Utama', location: 'New York, NY', manager: 'Alice Johnson', invoiceTemplate: 'sequential' },
  { id: 'BRN02', name: 'Cabang Barat', location: 'Los Angeles, CA', manager: 'Bob Williams', invoiceTemplate: 'date' },
  { id: 'BRN03', name: 'Cabang Timur', location: 'Miami, FL', manager: 'Charlie Brown', invoiceTemplate: 'custom' },
];

export const items: Item[] = [
  { id: 'ITM001', name: 'Laptop Pro 15"', sku: 'LP15-2024', category: 'Electronics', stock: 50, price: 1200, status: 'In Stock' },
  { id: 'ITM002', name: 'Wireless Mouse', sku: 'WM-BLK-01', category: 'Accessories', stock: 150, price: 25, status: 'In Stock' },
  { id: 'ITM003', name: 'Mechanical Keyboard', sku: 'MK-RGB-22', category: 'Accessories', stock: 8, price: 80, status: 'Low Stock' },
  { id: 'ITM004', name: '4K Monitor 27"', sku: '4KM-27-X', category: 'Monitors', stock: 30, price: 350, status: 'In Stock' },
  { id: 'ITM005', name: 'USB-C Hub', sku: 'USBC-HUB-8', category: 'Accessories', stock: 0, price: 45, status: 'Out of Stock' },
];

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
