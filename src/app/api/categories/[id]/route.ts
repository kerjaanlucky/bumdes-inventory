import { NextResponse } from 'next/server';
import mockCategories from '@/lib/mock/categories.json';
import { Category } from '@/lib/types';

let categories: Category[] = [...mockCategories];

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const category = categories.find((c) => c.id === parseInt(params.id));
  if (!category) {
    return new NextResponse('Category not found', { status: 404 });
  }
  return NextResponse.json(category);
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const updatedCategoryData: Category = await request.json();
  const index = categories.findIndex((c) => c.id === parseInt(params.id));

  if (index === -1) {
    return new NextResponse('Category not found', { status: 404 });
  }

  categories[index] = { ...categories[index], ...updatedCategoryData };
  return NextResponse.json(categories[index]);
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const index = categories.findIndex((c) => c.id === parseInt(params.id));
  if (index === -1) {
    return new NextResponse('Category not found', { status: 404 });
  }
  categories = categories.filter((c) => c.id !== parseInt(params.id));
  return new NextResponse(null, { status: 204 });
}
