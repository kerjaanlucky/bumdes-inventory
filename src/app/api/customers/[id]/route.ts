import { NextResponse } from 'next/server';
import { customers as mockCustomers, setCustomers } from '@/lib/data';
import { Customer } from '@/lib/types';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const customer = mockCustomers.find((c) => c.id === parseInt(params.id));
  if (!customer) {
    return new NextResponse('Customer not found', { status: 404 });
  }
  return NextResponse.json(customer);
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  let customers = mockCustomers;
  const updatedCustomerData: Customer = await request.json();
  const index = customers.findIndex((c) => c.id === parseInt(params.id));

  if (index === -1) {
    return new NextResponse('Customer not found', { status: 404 });
  }

  customers[index] = { ...customers[index], ...updatedCustomerData };
  setCustomers(customers);
  return NextResponse.json(customers[index]);
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  let customers = mockCustomers;
  const customerId = parseInt(params.id);
  const index = customers.findIndex((c) => c.id === customerId);
  if (index === -1) {
    return new NextResponse('Customer not found', { status: 404 });
  }

  // In a real app, you might check for related orders before deleting
  
  const newCustomers = customers.filter((c) => c.id !== customerId);
  setCustomers(newCustomers);
  
  return new NextResponse(null, { status: 204 });
}
