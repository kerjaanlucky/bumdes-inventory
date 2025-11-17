import { NextResponse } from 'next/server';
import { branches as initialBranches } from '@/lib/data';
import { Branch } from '@/lib/types';

let branches: Omit<Branch, 'manager'>[] = initialBranches.map(({ manager, ...rest }) => rest);


export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const branch = branches.find((b) => b.id === params.id);
  if (!branch) {
    return new NextResponse('Branch not found', { status: 404 });
  }
  return NextResponse.json(branch);
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const updatedBranchData: Omit<Branch, 'manager'> = await request.json();
  const index = branches.findIndex((b) => b.id === params.id);

  if (index === -1) {
    return new NextResponse('Branch not found', { status: 404 });
  }

  branches[index] = { ...branches[index], ...updatedBranchData };
  return NextResponse.json(branches[index]);
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const index = branches.findIndex((b) => b.id === params.id);
  if (index === -1) {
    return new NextResponse('Branch not found', { status: 404 });
  }
  branches = branches.filter((b) => b.id !== params.id);
  return new NextResponse(null, { status: 204 });
}
