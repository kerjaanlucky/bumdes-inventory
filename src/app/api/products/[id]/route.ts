import { NextResponse } from 'next/server';
import mockProducts from '@/lib/mock/products.json';
import { Product } from '@/lib/types';

let products: Product[] = [...mockProducts];

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const product = products.find((p) => p.id === parseInt(params.id));
  if (!product) {
    return new NextResponse('Product not found', { status: 404 });
  }
  return NextResponse.json(product);
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const updatedProductData: Product = await request.json();
  const index = products.findIndex((p) => p.id === parseInt(params.id));

  if (index === -1) {
    return new NextResponse('Product not found', { status: 404 });
  }

  products[index] = { ...products[index], ...updatedProductData };
  // In a real app, you'd save this back to the file/DB
  return NextResponse.json(products[index]);
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const index = products.findIndex((p) => p.id === parseInt(params.id));
  if (index === -1) {
    return new NextResponse('Product not found', { status: 404 });
  }
  products = products.filter((p) => p.id !== parseInt(params.id));
  // In a real app, you'd save this back to the file/DB
  return new NextResponse(null, { status: 204 });
}
