import { NextResponse } from 'next/server';
import { purchases as mockPurchases, setPurchases } from '@/lib/data';
import { Purchase } from '@/lib/types';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const purchase = mockPurchases.find((p) => p.id === parseInt(params.id));
  if (!purchase) {
    return new NextResponse('Purchase not found', { status: 404 });
  }
  return NextResponse.json(purchase);
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  let purchases = mockPurchases;
  const updatedPurchaseData: Purchase = await request.json();
  const index = purchases.findIndex((p) => p.id === parseInt(params.id));

  if (index === -1) {
    return new NextResponse('Purchase not found', { status: 404 });
  }

  purchases[index] = { ...purchases[index], ...updatedPurchaseData };
  setPurchases(purchases);
  return NextResponse.json(purchases[index]);
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  let purchases = mockPurchases;
  const purchaseId = parseInt(params.id);
  const index = purchases.findIndex((p) => p.id === purchaseId);
  if (index === -1) {
    return new NextResponse('Purchase not found', { status: 404 });
  }
  
  const newPurchases = purchases.filter((p) => p.id !== purchaseId);
  setPurchases(newPurchases);
  
  return new NextResponse(null, { status: 204 });
}
