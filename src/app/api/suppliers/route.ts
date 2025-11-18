import { NextResponse, NextRequest } from 'next/server';
import { suppliers as mockSuppliers, setSuppliers } from '@/lib/data';
import { Supplier } from '@/lib/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const search = searchParams.get('search') || '';
  const all = searchParams.get('all') === 'true';


  let filteredSuppliers = mockSuppliers;
  
  if (all) {
    return NextResponse.json(filteredSuppliers);
  }


  if (search) {
    filteredSuppliers = filteredSuppliers.filter(s =>
      s.nama_supplier.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.telepon?.toLowerCase().includes(search.toLowerCase())
    );
  }

  const total = filteredSuppliers.length;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginatedSuppliers = filteredSuppliers.slice(startIndex, endIndex);

  return NextResponse.json({
    data: paginatedSuppliers,
    total,
    page,
    limit,
  });
}

export async function POST(request: Request) {
  let suppliers = mockSuppliers;
  const newSupplierData: Omit<Supplier, 'id' | 'tenant_id'> = await request.json();
  const newSupplier: Supplier = {
    ...newSupplierData,
    id: suppliers.length > 0 ? Math.max(...suppliers.map(s => s.id)) + 1 : 1,
    tenant_id: 1, // Assuming a single tenant
  };
  const newSuppliers = [...suppliers, newSupplier];
  setSuppliers(newSuppliers);
  return NextResponse.json(newSupplier, { status: 201 });
}
