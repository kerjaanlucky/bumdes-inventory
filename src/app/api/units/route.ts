import { NextResponse, NextRequest } from 'next/server';
import { units as mockUnits, setUnits } from '@/lib/data';
import { Unit } from '@/lib/types';


export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const search = searchParams.get('search') || '';

  let filteredUnits = mockUnits;

  if (search) {
    filteredUnits = filteredUnits.filter(u =>
      u.nama_satuan.toLowerCase().includes(search.toLowerCase())
    );
  }

  const allUnitsForDropdown = searchParams.get('all');
  if (allUnitsForDropdown) {
    return NextResponse.json(mockUnits);
  }

  const total = filteredUnits.length;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginatedUnits = filteredUnits.slice(startIndex, endIndex);

  return NextResponse.json({
    data: paginatedUnits,
    total,
    page,
    limit,
  });
}

export async function POST(request: Request) {
  let units = mockUnits;
  const newUnitData: { nama_satuan: string } = await request.json();
  const newUnit: Unit = {
    ...newUnitData,
    id: units.length > 0 ? Math.max(...units.map(u => u.id)) + 1 : 1,
    tenant_id: 1, // Assuming a single tenant
  };
  const newUnits = [...units, newUnit];
  setUnits(newUnits);
  return NextResponse.json(newUnit, { status: 201 });
}
