import { Transaction, Sale, Product, Category, Unit, Customer, Supplier, Purchase } from "./types";
import initialProducts from './mock/products.json';
import initialCategories from './mock/categories.json';
import initialUnits from './mock/units.json';
import initialCustomers from './mock/customers.json';
import initialSuppliers from './mock/suppliers.json';
import initialPurchases from './mock/purchases.json';


// This is a temporary in-memory "database" to persist mock data across API requests.
// In a real application, this would be replaced with a proper database connection.
let productsDB: Product[] = [...initialProducts];
let categoriesDB: Category[] = [...initialCategories];
let unitsDB: Unit[] = [...initialUnits];
let customersDB: Customer[] = [...initialCustomers];
let suppliersDB: Supplier[] = [...initialSuppliers];
let purchasesDB: Purchase[] = [...initialPurchases];


export const products = productsDB;
export const categories = categoriesDB;
export const units = unitsDB;
export const customers = customersDB;
export const suppliers = suppliersDB;
export const purchases = purchasesDB;


export const setProducts = (newProducts: Product[]) => {
  productsDB = newProducts;
};
export const setCategories = (newCategories: Category[]) => {
  categoriesDB = newCategories;
};
export const setUnits = (newUnits: Unit[]) => {
  unitsDB = newUnits;
};
export const setCustomers = (newCustomers: Customer[]) => {
  customersDB = newCustomers;
};
export const setSuppliers = (newSuppliers: Supplier[]) => {
  suppliersDB = newSuppliers;
};
export const setPurchases = (newPurchases: Purchase[]) => {
    purchasesDB = newPurchases;
};



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

export const chartData = [
    { month: "January", total: Math.floor(Math.random() * 5000) + 1000 },
    { month: "February", total: Math.floor(Math.random() * 5000) + 1000 },
    { month: "March", total: Math.floor(Math.random() * 5000) + 1000 },
    { month: "April", total: Math.floor(Math.random() * 5000) + 1000 },
    { month: "May", total: Math.floor(Math.random() * 5000) + 1000 },
    { month: "June", total: Math.floor(Math.random() * 5000) + 1000 },
]
