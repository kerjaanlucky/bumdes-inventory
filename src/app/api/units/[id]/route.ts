import { NextResponse } from 'next/server';
import { units as mockUnits, setUnits, products as mockProducts } from '@/lib/data';
import { Unit } from '@/lib/types';


export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const unit = mockUnits.find((u) => u.id === parseInt(params.id));
  if (!unit) {
    return new NextResponse('Unit not found', { status: 404 });
  }
  return NextResponse.json(unit);
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  let units = mockUnits;
  const updatedUnitData: Unit = await request.json();
  const index = units.findIndex((u) => u.id === parseInt(params.id));

  if (index === -1) {
    return new NextResponse('Unit not found', { status: 404 });
  }

  units[index] = { ...units[index], ...updatedUnitData };
  setUnits(units);
  return NextResponse.json(units[index]);
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  let units = mockUnits;
  const unitId = parseInt(params.id);
  const index = units.findIndex((u) => u.id === unitId);
  if (index === -1) {
    return new NextResponse('Unit not found', { status: 404 });
  }

  const isOrphan = mockProducts.some(p => p.satuan_id === unitId);

  const newUnits = units.filter((u) => u.id !== unitId);
  setUnits(newUnits);

  return NextResponse.json({ isOrphan }, { status: 200 });
}
