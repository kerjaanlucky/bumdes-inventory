import { NextResponse } from 'next/server';
import initialUsers from '@/lib/mock/users.json';
import { User } from '@/lib/types';

let users: User[] = [...initialUsers];

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = users.find((u) => u.id === params.id);
  if (!user) {
    return new NextResponse('User not found', { status: 404 });
  }
  return NextResponse.json(user);
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const updatedUser: User = await request.json();
  const index = users.findIndex((u) => u.id === params.id);

  if (index === -1) {
    return new NextResponse('User not found', { status: 404 });
  }

  users[index] = { ...users[index], ...updatedUser };
  return NextResponse.json(users[index]);
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const index = users.findIndex((u) => u.id === params.id);
  if (index === -1) {
    return new NextResponse('User not found', { status: 404 });
  }
  users = users.filter((u) => u.id !== params.id);
  return new NextResponse(null, { status: 204 });
}
