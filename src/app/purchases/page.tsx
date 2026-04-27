import { PageHeader } from '@/components/page-header';
import { createClient } from '@/lib/supabase/server';
import { PurchasesTable } from './components/purchases-table';

async function getSales() {
    const supabase = createClient();
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
        customerName: sale.customers?.name ?? 'Unknown Customer',
        carName: sale.cars ? `${sale.cars.make} ${sale.cars.model}` : 'Unknown Car',
    }));
    
    return salesWithDetails.sort((a, b) => b.saleDate.getTime() - a.saleDate.getTime());
}


export default async function PurchasesPage() {
  const sales = await getSales();

  return (
    <div>
      <PageHeader
        title="Purchases"
        description="View all purchase and sales records."
      />
      <PurchasesTable sales={sales} />
    </div>
  );
}
