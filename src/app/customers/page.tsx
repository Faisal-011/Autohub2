import { PageHeader } from '@/components/page-header';
import { createClient } from '@/lib/supabase/server';
import { CustomerTable } from './components/customer-table';
import type { Customer } from '@/lib/types';

async function getCustomers() {
  const supabase = createClient();
  const { data, error } = await supabase.from('customers').select('*');

  if (error) {
    console.error('Error fetching customers:', error);
    return [];
  }

  const customers: Customer[] = data.map(customer => ({
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    purchaseHistory: [], // This column doesn't exist.
  }));

  return customers;
}

export default async function CustomersPage() {
  const customers = await getCustomers();
  return (
    <div>
      <PageHeader
        title="Customers"
        description="Manage your customer records."
      />
      <CustomerTable initialData={customers} />
    </div>
  );
}
