import { PageHeader } from '@/components/page-header';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  CarFront,
  Users,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

async function getDashboardData() {
  const supabase = await createClient();

  const { count: totalInventory, error: inventoryError } = await supabase
    .from('cars')
    .select('*', { count: 'exact', head: true });

  const { data: salesData, error: salesError } = await supabase
    .from('sales')
    .select('price');

  const { count: totalCustomers, error: customersError } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true });

  if (inventoryError || salesError || customersError) {
    console.error(
      'Error fetching dashboard data:',
      inventoryError,
      salesError,
      customersError
    );
    return {
      totalInventory: 0,
      totalSales: 0,
      totalCustomers: 0,
    };
  }

  const totalSales = salesData.reduce((sum, sale) => sum + sale.price, 0);

  return {
    totalInventory: totalInventory ?? 0,
    totalSales: totalSales,
    totalCustomers: totalCustomers ?? 0,
  };
}


export default async function DashboardPage() {
  const { totalInventory, totalSales, totalCustomers } = await getDashboardData();
  
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="An overview of your showroom's performance."
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Inventory
            </CardTitle>
            <CarFront className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInventory}</div>
            <p className="text-xs text-muted-foreground">
              vehicles available
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalSales.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              revenue generated
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              managed customer records
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
