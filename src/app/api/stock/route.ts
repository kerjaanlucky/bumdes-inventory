import { NextResponse, NextRequest } from 'next/server';
import { stockMovements as mockStockMovements, setStockMovements } from '@/lib/data';
import { StockMovement } from '@/lib/types';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const search = searchParams.get('search') || '';
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const productId = searchParams.get('productId');

  let filteredMovements = mockStockMovements;

  if (search) {
    filteredMovements = filteredMovements.filter(m =>
      m.nama_produk.toLowerCase().includes(search.toLowerCase()) ||
      m.referensi.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  if (from) {
    const startDate = startOfDay(parseISO(from));
    filteredMovements = filteredMovements.filter(m => new Date(m.tanggal) >= startDate);
  }

  if (to) {
    const endDate = endOfDay(parseISO(to));
    filteredMovements = filteredMovements.filter(m => new Date(m.tanggal) <= endDate);
  }
  
  if (productId) {
    filteredMovements = filteredMovements.filter(m => m.produk_id === parseInt(productId));
  }

  // Sort by date descending
  filteredMovements.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

  const total = filteredMovements.length;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginatedMovements = filteredMovements.slice(startIndex, endIndex);

  return NextResponse.json({
    data: paginatedMovements,
    total,
    page,
    limit,
  });
}

export async function POST(request: Request) {
  let movements = mockStockMovements;
  const newMovementData: Omit<StockMovement, 'id'> = await request.json();
  const newMovement: StockMovement = {
    ...newMovementData,
    id: movements.length > 0 ? Math.max(...movements.map(m => m.id)) + 1 : 1,
  };
  const newMovements = [newMovement, ...movements]; // Prepend new movement
  setStockMovements(newMovements);
  return NextResponse.json(newMovement, { status: 201 });
}
