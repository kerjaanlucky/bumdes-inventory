import { NextResponse } from 'next/server';
import initialBranches from '@/lib/mock/branches.json';
import { Branch } from '@/lib/types';

// This is a mock implementation. In a real app, this would be a database.
const branches: Branch[] = [...(initialBranches as Branch[])];

export async function GET() {
  return NextResponse.json(branches);
}

export async function POST(request: Request) {
  const newBranchData: Omit<Branch, 'id'> = await request.json();
  const newBranch: Branch = {
    ...newBranchData,
    id: `BRN${String(branches.length + 1).padStart(2, '0')}`,
  };
  branches.push(newBranch);
  return NextResponse.json(newBranch, { status: 201 });
}
