import { PageHeader } from '@/components/page-header';
import { createClient } from '@/lib/supabase/server';
import { CarTable } from './components/car-table';
import type { Car } from '@/lib/types';

async function getCars() {
  const supabase = createClient();
  const { data, error } = await supabase.from('cars').select('*');

  if (error) {
    console.error('Error fetching cars:', error);
    // In a real app, you'd want to handle this error more gracefully
    return [];
  }

  // The data from Supabase will have snake_case properties.
  // The CarTable component expects camelCase properties.
  // We need to map the data to match the component's expectations.
  const cars: Car[] = data.map(car => ({
    id: car.id,
    make: car.make,
    model: car.model,
    year: car.year,
    mileage: car.mileage,
    price: car.price,
    status: car.status,
    imageUrl: car.image_url,
    imageHint: car.image_hint
  }));

  return cars;
}

export default async function InventoryPage() {
  const cars = await getCars();

  return (
    <div>
      <PageHeader
        title="Car Inventory"
        description="Manage your vehicle listings."
      />
      <CarTable initialData={cars} />
    </div>
  );
}
