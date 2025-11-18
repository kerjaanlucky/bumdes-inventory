import { NextResponse } from 'next/server';
import { products as mockProducts, setProducts } from '@/lib/data';
import { Product } from '@/lib/types';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const product = mockProducts.find((p) => p.id === parseInt(params.id));
  if (!product) {
    return new NextResponse('Product not found', { status: 404 });
  }
  return NextResponse.json(product);
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  let products = mockProducts;
  const updatedProductData: Product = await request.json();
  const index = products.findIndex((p) => p.id === parseInt(params.id));

  if (index === -1) {
    return new NextResponse('Product not found', { status: 404 });
  }

  products[index] = { ...products[index], ...updatedProductData };
  setProducts(products);
  return NextResponse.json(products[index]);
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  let products = mockProducts;
  const index = products.findIndex((p) => p.id === parseInt(params.id));
  if (index === -1) {
    return new NextResponse('Product not found', { status: 404 });
  }
  const newProducts = products.filter((p) => p.id !== parseInt(params.id));
  setProducts(newProducts);
  return new NextResponse(null, { status: 204 });
}
