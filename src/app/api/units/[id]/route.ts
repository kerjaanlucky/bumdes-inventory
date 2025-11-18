import { NextResponse } from 'next/server';
import mockUnits from '@/lib/mock/units.json';
import { Unit } from '@/lib/types';

let units: Unit[] = [...mockUnits];

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const unit = units.find((u) => u.id === parseInt(params.id));
  if (!unit) {
    return new NextResponse('Unit not found', { status: 404 });
  }
  return NextResponse.json(unit);
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const updatedUnitData: Unit = await request.json();
  const index = units.findIndex((u) => u.id === parseInt(params.id));

  if (index === -1) {
    return new NextResponse('Unit not found', { status: 404 });
  }

  units[index] = { ...units[index], ...updatedUnitData };
  return NextResponse.json(units[index]);
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const index = units.findIndex((u) => u.id === parseInt(params.id));
  if (index === -1) {
    return new NextResponse('Unit not found', { status: 404 });
  }
  units = units.filter((u) => u.id !== parseInt(params.id));
  return new NextResponse(null, { status: 204 });
}
