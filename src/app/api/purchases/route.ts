import { NextResponse, NextRequest } from 'next/server';
import { 
  purchases as mockPurchases, 
  suppliers as mockSuppliers, 
  setPurchases 
} from '@/lib/data';
import { Purchase } from '@/lib/types';
import { format } from 'date-fns';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const search = searchParams.get('search') || '';

  let purchases = mockPurchases.map(p => ({
    ...p,
    nama_supplier: mockSuppliers.find(s => s.id === p.supplier_id)?.nama_supplier || 'N/A',
  }));

  let filteredPurchases = purchases;

  if (search) {
    filteredPurchases = filteredPurchases.filter(p =>
      p.nomor_pembelian.toLowerCase().includes(search.toLowerCase()) ||
      p.nama_supplier?.toLowerCase().includes(search.toLowerCase())
    );
  }

  const total = filteredPurchases.length;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginatedPurchases = filteredPurchases.slice(startIndex, endIndex);

  return NextResponse.json({
    data: paginatedPurchases,
    total,
    page,
    limit,
  });
}

export async function POST(request: Request) {
  let purchases = mockPurchases;
  const newPurchaseData: Omit<Purchase, 'id' | 'created_at' | 'nomor_pembelian' | 'status'> = await request.json();
  
  const today = new Date();
  const purchaseCountToday = purchases.filter(p => p.created_at.startsWith(format(today, "yyyy-MM-dd"))).length + 1;
  
  const newPurchase: Purchase = {
    ...newPurchaseData,
    id: purchases.length > 0 ? Math.max(...purchases.map(p => p.id)) + 1 : 1,
    nomor_pembelian: `PO-${format(today, "yyyyMM")}-${String(purchaseCountToday).padStart(3, '0')}`,
    status: 'DRAFT',
    created_at: today.toISOString(),
    history: [
      { status: 'DRAFT', tanggal: today.toISOString(), oleh: 'System' }
    ]
  };
  
  const newPurchases = [...purchases, newPurchase];
  setPurchases(newPurchases);
  return NextResponse.json(newPurchase, { status: 201 });
}
