import { NextResponse } from 'next/server';
import { suppliers as mockSuppliers, setSuppliers } from '@/lib/data';
import { Supplier } from '@/lib/types';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supplier = mockSuppliers.find((s) => s.id === parseInt(params.id));
  if (!supplier) {
    return new NextResponse('Supplier not found', { status: 404 });
  }
  return NextResponse.json(supplier);
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  let suppliers = mockSuppliers;
  const updatedSupplierData: Supplier = await request.json();
  const index = suppliers.findIndex((s) => s.id === parseInt(params.id));

  if (index === -1) {
    return new NextResponse('Supplier not found', { status: 404 });
  }

  suppliers[index] = { ...suppliers[index], ...updatedSupplierData };
  setSuppliers(suppliers);
  return NextResponse.json(suppliers[index]);
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  let suppliers = mockSuppliers;
  const supplierId = parseInt(params.id);
  const index = suppliers.findIndex((s) => s.id === supplierId);
  if (index === -1) {
    return new NextResponse('Supplier not found', { status: 404 });
  }

  // In a real app, you might check for related purchases before deleting
  
  const newSuppliers = suppliers.filter((s) => s.id !== supplierId);
  setSuppliers(newSuppliers);
  
  return new NextResponse(null, { status: 204 });
}
