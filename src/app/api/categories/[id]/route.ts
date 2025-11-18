import { NextResponse } from 'next/server';
import { categories as mockCategories, setCategories, products as mockProducts } from '@/lib/mock/data';
import { Category } from '@/lib/types';


export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const category = mockCategories.find((c) => c.id === parseInt(params.id));
  if (!category) {
    return new NextResponse('Category not found', { status: 404 });
  }
  return NextResponse.json(category);
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  let categories = mockCategories;
  const updatedCategoryData: Category = await request.json();
  const index = categories.findIndex((c) => c.id === parseInt(params.id));

  if (index === -1) {
    return new NextResponse('Category not found', { status: 404 });
  }

  categories[index] = { ...categories[index], ...updatedCategoryData };
  setCategories(categories);
  return NextResponse.json(categories[index]);
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  let categories = mockCategories;
  const categoryId = parseInt(params.id);
  const index = categories.findIndex((c) => c.id === categoryId);

  if (index === -1) {
    return new NextResponse('Category not found', { status: 404 });
  }
  
  const isOrphan = mockProducts.some(p => p.kategori_id === categoryId);
  
  const newCategories = categories.filter((c) => c.id !== categoryId);
  setCategories(newCategories);
  
  return NextResponse.json({ isOrphan }, { status: 200 });
}
