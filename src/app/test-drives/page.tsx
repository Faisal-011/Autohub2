import { PageHeader } from '@/components/page-header';
import { createClient } from '@/lib/supabase/server';
import { TestDriveTable } from './components/test-drive-table';
import type { TestDrive, TestDriveWithDetails } from '@/lib/types';
import { AddTestDrive } from './components/add-test-drive';

async function getTestDrives() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('test_drives')
    .select(`
      id,
      date,
      status,
      car_id,
      customer_id,
      customers ( name ),
      cars ( make, model )
    `)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching test drives:', error);
    return [];
  }

  const testDrives: TestDriveWithDetails[] = data.map(td => ({
    id: td.id,
    customerId: td.customer_id,
    carId: td.car_id,
    date: new Date(td.date),
    status: td.status,
    // @ts-ignore
    customerName: td.customers.name,
    // @ts-ignore
    carName: `${td.cars.make} ${td.cars.model}`,
  }));

  return testDrives;
}

async function getCarsAndCustomers() {
    const supabase = createClient();
    const { data: cars, error: carsError } = await supabase.from('cars').select('id, make, model').eq('status', 'Available');
    const { data: customers, error: customersError } = await supabase.from('customers').select('id, name');

    if (carsError || customersError) {
        console.error('Error fetching cars or customers', carsError, customersError);
    }
    return { cars: cars || [], customers: customers || [] };
}

export default async function TestDrivesPage() {
  const testDrives = await getTestDrives();
  const { cars, customers } = await getCarsAndCustomers();

  return (
    <div>
      <PageHeader
        title="Test Drives"
        description="Schedule and manage test drives."
      >
        <AddTestDrive cars={cars} customers={customers} />
      </PageHeader>
      <TestDriveTable initialData={testDrives} />
    </div>
  );
}
