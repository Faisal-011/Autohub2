import { PageHeader } from '@/components/page-header';
import { createClient } from '@/lib/supabase/server';
import { RentalsTable } from './components/rentals-table';
import type { RentalWithDetails } from '@/lib/types';

async function getRentals() {
    const supabase = await createClient();
    const { data, error } = await supabase.from('rentals').select('*, customers(name), cars(make, model)');

    if (error) {
        console.error('Error fetching rentals:', error);
        return [];
    }

    const rentals: RentalWithDetails[] = data.map((rental: any) => ({
        id: rental.id,
        carId: rental.car_id,
        customerId: rental.customer_id,
        startDate: new Date(rental.start_date),
        endDate: new Date(rental.end_date),
        totalFee: rental.total_fee,
        status: rental.status,
        customerName: rental.customers?.name ?? 'Unknown Customer',
        carName: rental.cars ? `${rental.cars.make} ${rental.cars.model}` : 'Unknown Car',
    }));
    
    return rentals.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
}

async function getCarsAndCustomers() {
  const supabase = await createClient();
  // Only fetch available cars for new rentals
  const { data: cars, error: carsError } = await supabase.from('cars').select('id, make, model').eq('status', 'Available');
  const { data: customers, error: customersError } = await supabase.from('customers').select('id, name');

  if (carsError || customersError) {
      console.error('Error fetching cars or customers', carsError, customersError);
  }
  return { cars: cars || [], customers: customers || [] };
}


export default async function RentalsPage() {
  const rentals = await getRentals();
  const { cars, customers } = await getCarsAndCustomers();

  return (
    <div>
      <PageHeader
        title="Car Rentals"
        description="Manage your rental fleet and agreements."
      />
      <RentalsTable 
        rentals={rentals}
        cars={cars}
        customers={customers}
      />
    </div>
  );
}
