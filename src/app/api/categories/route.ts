import { NextResponse, NextRequest } from 'next/server';
import mockCategories from '@/lib/mock/categories.json';
import { Category } from '@/lib/types';

let categories: Category[] = [...mockCategories];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const search = searchParams.get('search') || '';

  let filteredCategories = categories;

  if (search) {
    filteredCategories = filteredCategories.filter(c =>
      c.nama_kategori.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  const allCategoriesForDropdown = searchParams.get('all');
  if (allCategoriesForDropdown) {
    return NextResponse.json(categories);
  }

  const total = filteredCategories.length;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginatedCategories = filteredCategories.slice(startIndex, endIndex);

  return NextResponse.json({
    data: paginatedCategories,
    total,
    page,
    limit,
  });
}

export async function POST(request: Request) {
  const newCategoryData: { nama_kategori: string } = await request.json();
  const newCategory: Category = {
    ...newCategoryData,
    id: categories.length > 0 ? Math.max(...categories.map(c => c.id)) + 1 : 1,
    tenant_id: 1, // Assuming a single tenant
  };
  categories.push(newCategory);
  return NextResponse.json(newCategory, { status: 201 });
}
