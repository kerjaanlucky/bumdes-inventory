import { NextResponse } from 'next/server';
import { branches as initialBranches } from '@/lib/data';
import { Branch } from '@/lib/types';

let branches: Omit<Branch, 'manager'>[] = initialBranches.map(({ manager, ...rest }) => rest);

export async function GET() {
  return NextResponse.json(branches);
}

export async function POST(request: Request) {
  const newBranchData: Omit<Branch, 'id'| 'manager'> = await request.json();
  const newBranch = {
    ...newBranchData,
    id: `BRN${String(branches.length + 1).padStart(2, '0')}`,
  };
  branches.push(newBranch);
  return NextResponse.json(newBranch, { status: 201 });
}
