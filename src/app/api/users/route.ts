import { NextResponse } from 'next/server';
import { users as initialUsers } from '@/lib/data';
import { User } from '@/lib/types';

// In a real app, this would be a database.
// For this mock, we're just using an in-memory array.
// Note: This will reset on every server restart.
let users: User[] = [...initialUsers];

export async function GET() {
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const newUser: Omit<User, 'id' | 'avatar'> = await request.json();
  const user: User = {
    ...newUser,
    id: `USR${String(users.length + 1).padStart(3, '0')}`,
    avatar: `/avatars/0${(users.length % 4) + 1}.png`,
  };
  users.push(user);
  return NextResponse.json(user, { status: 201 });
}
