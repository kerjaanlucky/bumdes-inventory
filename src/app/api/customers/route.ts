import { NextResponse, NextRequest } from 'next/server';
import { customers as mockCustomers, setCustomers } from '@/lib/data';
import { Customer } from '@/lib/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const search = searchParams.get('search') || '';

  let filteredCustomers = mockCustomers;

  if (search) {
    filteredCustomers = filteredCustomers.filter(c =>
      c.nama_customer.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.telepon?.toLowerCase().includes(search.toLowerCase())
    );
  }

  const total = filteredCustomers.length;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

  return NextResponse.json({
    data: paginatedCustomers,
    total,
    page,
    limit,
  });
}

export async function POST(request: Request) {
  let customers = mockCustomers;
  const newCustomerData: Omit<Customer, 'id' | 'tenant_id'> = await request.json();
  const newCustomer: Customer = {
    ...newCustomerData,
    id: customers.length > 0 ? Math.max(...customers.map(c => c.id)) + 1 : 1,
    tenant_id: 1, // Assuming a single tenant
  };
  const newCustomers = [...customers, newCustomer];
  setCustomers(newCustomers);
  return NextResponse.json(newCustomer, { status: 201 });
}
