import { PageHeader } from '@/components/page-header';
import { createClient } from '@/lib/supabase/server';
import { SalesTable } from './components/sales-table';
import type { Sale } from '@/lib/types';

async function getSales() {
    const supabase = await createClient();
    const { data, error } = await supabase.from('sales').select('*, customers(name), cars(make, model)');

    if (error) {
        console.error('Error fetching sales:', error);
        return [];
    }

    const salesWithDetails = data.map((sale: any) => ({
        id: sale.id,
        carId: sale.car_id,
        customerId: sale.customer_id,
        saleDate: new Date(sale.sale_date),
        price: sale.price,
        customerName: sale.customers.name,
        carName: `${sale.cars.make} ${sale.cars.model}`,
    }));

    return salesWithDetails;
}

async function getCarsAndCustomers() {
    const supabase = await createClient();
    // Only fetch available cars for new sales
    const { data: cars, error: carsError } = await supabase.from('cars').select('id, make, model, price').eq('status', 'Available');
    const { data: customers, error: customersError } = await supabase.from('customers').select('id, name');

    if (carsError || customersError) {
        console.error('Error fetching cars or customers', carsError, customersError);
    }
    return { cars: cars || [], customers: customers || [] };
}


export default async function SalesPage() {
  const sales = await getSales();
  const { cars, customers } = await getCarsAndCustomers();

  return (
    <div>
      <PageHeader
        title="Sales"
        description="Track and manage all car sales."
      />
      <SalesTable 
        sales={sales} 
        cars={cars}
        customers={customers}
      />
    </div>
  );
}
