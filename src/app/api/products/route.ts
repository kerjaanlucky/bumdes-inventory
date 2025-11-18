import { NextResponse, NextRequest } from 'next/server';
import { products as mockProducts, categories as mockCategories, units as mockUnits, setProducts } from '@/lib/mock/data';
import { Product } from '@/lib/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const search = searchParams.get('search') || '';

  let products = mockProducts.map(p => ({
    ...p,
    nama_kategori: mockCategories.find(c => c.id === p.kategori_id)?.nama_kategori || 'N/A',
    nama_satuan: mockUnits.find(u => u.id === p.satuan_id)?.nama_satuan || 'N/A',
  }));

  let filteredProducts = products;

  if (search) {
    filteredProducts = filteredProducts.filter(p =>
      p.nama_produk.toLowerCase().includes(search.toLowerCase()) ||
      p.kode_produk.toLowerCase().includes(search.toLowerCase())
    );
  }

  const total = filteredProducts.length;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  return NextResponse.json({
    data: paginatedProducts,
    total,
    page,
    limit,
  });
}

export async function POST(request: Request) {
  let products = mockProducts;
  const newProductData: Omit<Product, 'id'> = await request.json();
  const newProduct: Product = {
    ...newProductData,
    id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
    nama_kategori: mockCategories.find(c => c.id === newProductData.kategori_id)?.nama_kategori,
    nama_satuan: mockUnits.find(u => u.id === newProductData.satuan_id)?.nama_satuan,
  };
  const newProducts = [...products, newProduct];
  setProducts(newProducts);
  return NextResponse.json(newProduct, { status: 201 });
}
